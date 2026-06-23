// src/core/serializers/buildPlanPreviewData.ts
import { ChargeModelEnum, PlanInterval } from '~/generated/graphql'

import type { PlanFormInput, PlanPayload } from './serializeQuotePlanBillingItems'

export type BilledTiming = 'beginningOfPeriod' | 'endOfPeriod' | 'onTransaction'

export type PreviewCellValue =
  | { type: 'count'; value: number }
  | { type: 'amount'; amountCents: string }
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

export type PlanPreviewMainRow = {
  kind: 'main'
  rowType: 'subscriptionFee' | 'fixedCharge' | 'usageCharge' | 'minimumCommitment'
  name?: string
  description?: string
  interval: PlanInterval
  timing: BilledTiming
  units: PreviewCellValue
  price: PreviewCellValue
}

export type PlanPreviewDetailRow = {
  kind: 'detail'
  label: PreviewDetailLabel
  qualifier: PreviewQualifier
  value: PreviewCellValue
}

export type PlanPreviewRow = PlanPreviewMainRow | PlanPreviewDetailRow

export type PlanPreviewData = { rows: PlanPreviewRow[] }

const num = (v: unknown): number => {
  const n = Number.parseFloat(String(v ?? ''))

  return Number.isFinite(n) ? n : 0
}

const fixedTiming = (payInAdvance: boolean): BilledTiming =>
  payInAdvance ? 'beginningOfPeriod' : 'endOfPeriod'

const usageTiming = (payInAdvance: boolean): BilledTiming =>
  payInAdvance ? 'onTransaction' : 'endOfPeriod'

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

// Per-model detail rows are added in Tasks 4 & 5. Standard handled here.
const usageDetailRows = (charge: any): PlanPreviewDetailRow[] => {
  const props = (charge.properties ?? {}) as Record<string, unknown>

  if (charge.chargeModel === ChargeModelEnum.Standard) {
    return [
      {
        kind: 'detail',
        label: { type: 'text', key: 'labelUsage' },
        qualifier: { type: 'perUnit' },
        value: { type: 'amount', amountCents: String(props.amount ?? '0') },
      },
    ]
  }

  return []
}

export const buildPlanPreviewData = (
  formValues: PlanFormInput | null,
  _payload: PlanPayload,
): PlanPreviewData => {
  if (!formValues) return { rows: [] }

  const rows: PlanPreviewRow[] = []

  // 1) Subscription fee
  if (num(formValues.amountCents) > 0) {
    rows.push({
      kind: 'main',
      rowType: 'subscriptionFee',
      name: formValues.invoiceDisplayName || undefined,
      description: undefined,
      interval: formValues.interval,
      timing: fixedTiming(formValues.payInAdvance),
      units: { type: 'count', value: 1 },
      price: { type: 'amount', amountCents: String(formValues.amountCents) },
    })
  }

  // 2) Fixed charges
  for (const fc of formValues.fixedCharges ?? []) {
    rows.push({
      kind: 'main',
      rowType: 'fixedCharge',
      name: fc.invoiceDisplayName || (fc as any).addOn?.name || undefined,
      description: undefined,
      interval: fixedInterval(formValues),
      timing: fixedTiming(fc.payInAdvance),
      units: { type: 'count', value: num(fc.units) },
      price: { type: 'amount', amountCents: String((fc as any).properties?.amount ?? '0') },
    })
  }

  // 3) Usage charges (each is a main row + model-specific detail rows)
  for (const charge of formValues.charges ?? []) {
    rows.push({
      kind: 'main',
      rowType: 'usageCharge',
      name: chargeName(charge as any) || undefined,
      description: (charge as any).invoiceDisplayName ? undefined : undefined,
      interval: usageInterval(formValues),
      timing: usageTiming((charge as any).payInAdvance),
      units: { type: 'usageBased' },
      price: { type: 'variesWithUsage' },
    })
    rows.push(...usageDetailRows(charge))
  }

  // 4) Plan minimum commitment (own row)
  if (formValues.minimumCommitment) {
    rows.push({
      kind: 'main',
      rowType: 'minimumCommitment',
      name: formValues.minimumCommitment.invoiceDisplayName || undefined,
      description: undefined,
      interval: formValues.interval,
      timing: fixedTiming(formValues.payInAdvance),
      units: { type: 'count', value: 1 },
      price: {
        type: 'amount',
        amountCents: String(formValues.minimumCommitment.amountCents ?? '0'),
      },
    })
  }

  return { rows }
}
