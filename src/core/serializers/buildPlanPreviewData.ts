// src/core/serializers/buildPlanPreviewData.ts
import type {
  LocalFixedChargeInput,
  LocalUsageChargeInput,
  PlanFormInput,
} from '~/components/plans/types'
import { ChargeModelEnum, FixedChargeChargeModelEnum, PlanInterval } from '~/generated/graphql'

type BilledTiming = 'beginningOfPeriod' | 'endOfPeriod' | 'onTransaction'

export type PreviewCellValue =
  | { type: 'count'; value: number }
  | { type: 'displayAmount'; amount: string }
  | { type: 'percentage'; rate: string }
  | { type: 'usageBased' }
  | { type: 'variesWithUsage' }
  | { type: 'empty' }

export type PreviewDetailLabel =
  // `key` is a name in the Translation Key Map; the component resolves K.<key>.
  | { type: 'text'; key: string }
  | { type: 'tierRange'; from: number; to?: number }
  | { type: 'flatFeeForTier'; from: number; to?: number }

export type PreviewQualifier =
  | { type: 'perUnit' }
  | { type: 'flatFee' }
  | { type: 'percentOfVolume' }
  | { type: 'perPackage'; size: number }
  | { type: 'firstNUnits'; count: number }
  | { type: 'firstNTransactions'; count: number }
  | { type: 'perTransaction' }
  | { type: 'commitment' }

type PlanPreviewMainRow = {
  kind: 'main'
  rowType: 'subscriptionFee' | 'fixedCharge' | 'usageCharge' | 'minimumCommitment'
  name?: string
  description?: string
  interval: PlanInterval
  timing: BilledTiming
  units: PreviewCellValue
  price: PreviewCellValue
}

type PlanPreviewDetailRow = {
  kind: 'detail'
  label: PreviewDetailLabel
  qualifier: PreviewQualifier
  value: PreviewCellValue
}

export type PlanPreviewRow = PlanPreviewMainRow | PlanPreviewDetailRow

export type PlanPreviewData = { rows: PlanPreviewRow[] }

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number.parseFloat(typeof v === 'string' ? v : '')

  return Number.isFinite(n) ? n : 0
}

// Property bags are typed `unknown`; coerce only primitives so an unexpected
// object never stringifies to '[object Object]'.
const amountStr = (v: unknown, fallback = '0'): string =>
  typeof v === 'string' || typeof v === 'number' ? String(v) : fallback

const fixedTiming = (payInAdvance: boolean): BilledTiming =>
  payInAdvance ? 'beginningOfPeriod' : 'endOfPeriod'

const usageTiming = (payInAdvance: boolean): BilledTiming =>
  payInAdvance ? 'onTransaction' : 'endOfPeriod'

// Percentage charges are always quoted on transaction, regardless of pay-in-advance.
const usageChargeTiming = (charge: LocalUsageChargeInput): BilledTiming =>
  charge.chargeModel === ChargeModelEnum.Percentage
    ? 'onTransaction'
    : usageTiming(charge.payInAdvance ?? false)

// Charge cadence: monthly override applies when the plan is non-monthly and the
// monthly-billing flag is set; otherwise the plan interval. (Assumption — verify
// against product expectations; see plan notes.)
const usageInterval = (form: PlanFormInput): PlanInterval =>
  form.billChargesMonthly && form.interval !== PlanInterval.Monthly
    ? PlanInterval.Monthly
    : form.interval

const fixedInterval = (form: PlanFormInput): PlanInterval =>
  form.billFixedChargesMonthly && form.interval !== PlanInterval.Monthly
    ? PlanInterval.Monthly
    : form.interval

const chargeName = (charge: {
  invoiceDisplayName?: string | null
  billableMetric?: { name?: string }
}): string => charge.invoiceDisplayName || charge.billableMetric?.name || ''

type Range = {
  fromValue: number
  toValue?: number | null
  perUnitAmount?: string
  flatAmount?: string
}

const tierRows = (ranges: Range[]): PlanPreviewDetailRow[] =>
  ranges.flatMap((r) => {
    const out: PlanPreviewDetailRow[] = [
      {
        kind: 'detail',
        label: {
          type: 'tierRange',
          from: num(r.fromValue),
          to: r.toValue === null || r.toValue === undefined ? undefined : num(r.toValue),
        },
        qualifier: { type: 'perUnit' },
        value: { type: 'displayAmount', amount: String(r.perUnitAmount ?? '0') },
      },
    ]

    if (num(r.flatAmount) > 0) {
      out.push({
        kind: 'detail',
        label: {
          type: 'flatFeeForTier',
          from: num(r.fromValue),
          to: r.toValue === null || r.toValue === undefined ? undefined : num(r.toValue),
        },
        qualifier: { type: 'flatFee' },
        value: { type: 'displayAmount', amount: String(r.flatAmount) },
      })
    }

    return out
  })

const standardDetailRows = (props: Record<string, unknown>): PlanPreviewDetailRow[] => [
  {
    kind: 'detail',
    label: { type: 'text', key: 'labelUsage' },
    qualifier: { type: 'perUnit' },
    value: { type: 'displayAmount', amount: amountStr(props.amount) },
  },
]

const packageDetailRows = (props: Record<string, unknown>): PlanPreviewDetailRow[] => {
  const out: PlanPreviewDetailRow[] = []

  if (num(props.freeUnits) > 0) {
    out.push({
      kind: 'detail',
      label: { type: 'text', key: 'labelFreeUnits' },
      qualifier: { type: 'firstNUnits', count: num(props.freeUnits) },
      value: { type: 'displayAmount', amount: '0' },
    })
  }
  out.push({
    kind: 'detail',
    label: { type: 'text', key: 'labelPackage' },
    qualifier: { type: 'perPackage', size: num(props.packageSize) },
    value: { type: 'displayAmount', amount: amountStr(props.amount) },
  })

  return out
}

const percentageDetailRows = (props: Record<string, unknown>): PlanPreviewDetailRow[] => {
  const out: PlanPreviewDetailRow[] = []

  if (num(props.freeUnitsPerTotalAggregation) > 0) {
    out.push({
      kind: 'detail',
      label: { type: 'text', key: 'labelFreeVolume' },
      qualifier: { type: 'firstNUnits', count: num(props.freeUnitsPerTotalAggregation) },
      value: { type: 'percentage', rate: '0' },
    })
  }
  if (num(props.freeUnitsPerEvents) > 0) {
    out.push({
      kind: 'detail',
      label: { type: 'text', key: 'labelFreeTransactions' },
      qualifier: { type: 'firstNTransactions', count: num(props.freeUnitsPerEvents) },
      value: { type: 'percentage', rate: '0' },
    })
  }
  // Always-present transaction cost
  out.push({
    kind: 'detail',
    label: { type: 'text', key: 'labelTransactionCost' },
    qualifier: { type: 'percentOfVolume' },
    value: { type: 'percentage', rate: amountStr(props.rate) },
  })
  if (num(props.fixedAmount) > 0) {
    out.push({
      kind: 'detail',
      label: { type: 'text', key: 'labelFixedFee' },
      qualifier: { type: 'perTransaction' },
      value: { type: 'displayAmount', amount: amountStr(props.fixedAmount) },
    })
  }
  if (num(props.perTransactionMinAmount) > 0) {
    out.push({
      kind: 'detail',
      label: { type: 'text', key: 'labelMinimum' },
      qualifier: { type: 'perTransaction' },
      value: { type: 'displayAmount', amount: amountStr(props.perTransactionMinAmount) },
    })
  }
  if (num(props.perTransactionMaxAmount) > 0) {
    out.push({
      kind: 'detail',
      label: { type: 'text', key: 'labelMaximum' },
      qualifier: { type: 'perTransaction' },
      value: { type: 'displayAmount', amount: amountStr(props.perTransactionMaxAmount) },
    })
  }

  return out
}

const graduatedPercentageDetailRows = (props: Record<string, unknown>): PlanPreviewDetailRow[] => {
  const ranges = (props.graduatedPercentageRanges ?? []) as Array<{
    fromValue: number
    toValue?: number | null
    rate?: string
    flatAmount?: string
  }>

  return ranges.flatMap((r) => {
    const out: PlanPreviewDetailRow[] = [
      {
        kind: 'detail',
        label: {
          type: 'tierRange',
          from: num(r.fromValue),
          to: r.toValue === null || r.toValue === undefined ? undefined : num(r.toValue),
        },
        qualifier: { type: 'percentOfVolume' },
        value: { type: 'percentage', rate: String(r.rate ?? '0') },
      },
    ]

    if (num(r.flatAmount) > 0) {
      out.push({
        kind: 'detail',
        label: {
          type: 'flatFeeForTier',
          from: num(r.fromValue),
          to: r.toValue === null || r.toValue === undefined ? undefined : num(r.toValue),
        },
        qualifier: { type: 'flatFee' },
        value: { type: 'displayAmount', amount: String(r.flatAmount) },
      })
    }

    return out
  })
}

// Dispatch per charge model. dynamic / custom → no detail rows (main usage row only).
const usageDetailRows = (charge: LocalUsageChargeInput): PlanPreviewDetailRow[] => {
  const props = (charge.properties ?? {}) as Record<string, unknown>

  switch (charge.chargeModel) {
    case ChargeModelEnum.Standard:
      return standardDetailRows(props)
    case ChargeModelEnum.Graduated:
      return tierRows((props.graduatedRanges ?? []) as Range[])
    case ChargeModelEnum.Volume:
      return tierRows((props.volumeRanges ?? []) as Range[])
    case ChargeModelEnum.Package:
      return packageDetailRows(props)
    case ChargeModelEnum.Percentage:
      return percentageDetailRows(props)
    case ChargeModelEnum.GraduatedPercentage:
      return graduatedPercentageDetailRows(props)
    default:
      return []
  }
}

const subscriptionFeeRows = (formValues: PlanFormInput): PlanPreviewRow[] => {
  if (num(formValues.amountCents) <= 0) return []

  return [
    {
      kind: 'main',
      rowType: 'subscriptionFee',
      name: formValues.invoiceDisplayName || undefined,
      description: undefined,
      interval: formValues.interval,
      timing: fixedTiming(formValues.payInAdvance),
      units: { type: 'count', value: 1 },
      price: { type: 'displayAmount', amount: String(formValues.amountCents) },
    },
  ]
}

const fixedChargeRows = (
  charge: LocalFixedChargeInput,
  formValues: PlanFormInput,
): PlanPreviewRow[] => {
  // Filter here, not in the table: SubscriptionPlanPreviewTable groups a charge with its
  // detail rows by array index, so a gap there would misplace the dividers.
  if (charge.displayInQuoteDocument === false) return []

  const props = (charge.properties ?? {}) as Record<string, unknown>
  const mainRow = (price: PreviewCellValue): PlanPreviewRow => ({
    kind: 'main',
    rowType: 'fixedCharge',
    name: charge.invoiceDisplayName || charge.addOn?.name || undefined,
    description: undefined,
    interval: fixedInterval(formValues),
    timing: fixedTiming(charge.payInAdvance ?? false),
    units: { type: 'count', value: num(charge.units) },
    price,
  })

  if (charge.chargeModel === FixedChargeChargeModelEnum.Graduated) {
    return [mainRow({ type: 'empty' }), ...tierRows((props.graduatedRanges ?? []) as Range[])]
  }

  if (charge.chargeModel === FixedChargeChargeModelEnum.Volume) {
    return [mainRow({ type: 'empty' }), ...tierRows((props.volumeRanges ?? []) as Range[])]
  }

  return [mainRow({ type: 'displayAmount', amount: amountStr(props.amount) })]
}

const usageChargeRows = (
  charge: LocalUsageChargeInput,
  formValues: PlanFormInput,
): PlanPreviewRow[] => {
  if (charge.displayInQuoteDocument === false) return []

  const rows: PlanPreviewRow[] = [
    {
      kind: 'main',
      rowType: 'usageCharge',
      name: chargeName(charge) || undefined,
      description: undefined,
      interval: usageInterval(formValues),
      timing: usageChargeTiming(charge),
      units: { type: 'usageBased' },
      price: { type: 'variesWithUsage' },
    },
    ...usageDetailRows(charge),
  ]

  if (num(charge.minAmountCents) > 0) {
    rows.push({
      kind: 'detail',
      label: { type: 'text', key: 'labelMinimumSpending' },
      qualifier: { type: 'commitment' },
      value: { type: 'displayAmount', amount: String(charge.minAmountCents) },
    })
  }

  return rows
}

const minimumCommitmentRows = (formValues: PlanFormInput): PlanPreviewRow[] => {
  const commitment = formValues.minimumCommitment

  // `deserializeMinimumCommitment` returns `{}` for "no commitment", which is truthy, so
  // gate on the amount the way the subscription fee does.
  if (!commitment || num(commitment.amountCents) <= 0) return []

  return [
    {
      kind: 'main',
      rowType: 'minimumCommitment',
      name: commitment.invoiceDisplayName || undefined,
      description: undefined,
      interval: formValues.interval,
      timing: fixedTiming(formValues.payInAdvance),
      units: { type: 'count', value: 1 },
      price: { type: 'displayAmount', amount: String(commitment.amountCents) },
    },
  ]
}

export const buildPlanPreviewData = (formValues: PlanFormInput | null): PlanPreviewData => {
  if (!formValues) return { rows: [] }

  return {
    rows: [
      ...subscriptionFeeRows(formValues),
      ...(formValues.fixedCharges ?? []).flatMap((fc) =>
        fixedChargeRows(fc as LocalFixedChargeInput, formValues),
      ),
      ...(formValues.charges ?? []).flatMap((charge) =>
        usageChargeRows(charge as LocalUsageChargeInput, formValues),
      ),
      ...minimumCommitmentRows(formValues),
    ],
  }
}
