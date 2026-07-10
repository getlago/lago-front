import type { EntityData } from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import type {
  LocalFixedChargeInput,
  LocalUsageChargeInput,
  PlanFormInput,
} from '~/components/plans/types'
import { CommitmentTypeEnum, CurrencyEnum } from '~/generated/graphql'

import { buildPlanPreviewData } from './buildPlanPreviewData'
import { deserializeAmount, serializeAmount } from './serializeAmount'

// Re-export so consumers can import PlanFormInput from this serializer module.
export type { PlanFormInput }

// --- Plan billing item types (camelCase, matches backend contract) ---
interface PlanChargeOverride {
  billableMetricCode: string
  chargeModel: string
  properties: Record<string, unknown>
}

interface PlanMinimumCommitmentOverride {
  amountCents: number
  invoiceDisplayName?: string
}

interface PlanUsageThresholdOverride {
  amountCents: number
  recurring: boolean
  thresholdDisplayName?: string
}

export interface PlanOverrides {
  amountCents?: number
  invoiceDisplayName?: string
  minimumCommitment?: PlanMinimumCommitmentOverride
  charges?: PlanChargeOverride[]
  usageThresholds?: PlanUsageThresholdOverride[]
}

// --- Serialized plan form types (stored in PlanPayload for form reconstruction) ---

interface SerializedTax {
  id: string
  code: string
  name: string
  rate: number
}

interface SerializedBillableMetric {
  id: string
  code: string
  name: string
  aggregationType: string
  recurring: boolean
  filters: Array<{ id: string; key: string; values: string[] }>
}

interface SerializedChargeFilter {
  invoiceDisplayName: string | null
  properties: Record<string, unknown>
  values: string[]
}

interface SerializedAppliedPricingUnit {
  code: string
  shortName: string
  type: string
  conversionRate: string
}

interface SerializedCharge {
  id?: string
  billableMetric: SerializedBillableMetric
  chargeModel: string
  properties: Record<string, unknown>
  invoiceDisplayName: string
  minAmountCents: string | undefined
  payInAdvance: boolean
  prorated: boolean
  regroupPaidFees: string | null
  invoiceable: boolean
  taxCodes: string[]
  taxes: SerializedTax[]
  filters: SerializedChargeFilter[]
  appliedPricingUnit: SerializedAppliedPricingUnit | null
}

interface SerializedAddOn {
  id: string
  name: string
  code: string
}

interface SerializedFixedCharge {
  id?: string
  addOn: SerializedAddOn
  chargeModel: string
  units: string
  applyUnitsImmediately: boolean
  invoiceDisplayName: string | null
  payInAdvance: boolean
  prorated: boolean
  properties: Record<string, unknown>
  taxCodes: string[]
  taxes: SerializedTax[]
}

interface SerializedMinimumCommitment {
  id?: string
  amountCents: string
  invoiceDisplayName: string | null
  commitmentType: string
  taxCodes: string[]
  taxes: SerializedTax[]
}

interface SerializedUsageThreshold {
  id?: string
  amountCents: number | string
  thresholdDisplayName: string | null
  recurring: boolean
}

interface PlanPayload {
  position: number
  code: string
  name: string
  description: string
  subscriptionExternalId: string | null
  subscriptionName: string | null
  billingTime: 'anniversary' | 'calendar'
  startDate: string | null
  endDate: string | null
  paymentMethodId: string | null
  invoiceCustomFooter: string | null

  // --- Plan configuration (optional for backward compat with legacy payloads) ---
  interval?: string
  amountCents?: string
  amountCurrency?: string
  payInAdvance?: boolean
  billChargesMonthly?: boolean | null
  billFixedChargesMonthly?: boolean | null
  trialPeriod?: number
  invoiceDisplayName?: string | null
  taxCodes?: string[]
  taxes?: SerializedTax[]

  // --- Charges (optional for backward compat) ---
  charges?: SerializedCharge[]
  fixedCharges?: SerializedFixedCharge[]

  // --- Commitments & thresholds (optional for backward compat) ---
  minimumCommitment?: SerializedMinimumCommitment | null
  nonRecurringUsageThresholds?: SerializedUsageThreshold[]
  recurringUsageThreshold?: SerializedUsageThreshold | null
}

export interface BillingItemPlan {
  type: 'plan'
  id: string
  payload: PlanPayload
  overrides: PlanOverrides
}

// --- Frontend state types (camelCase) ---

export interface SubscriptionSettings {
  externalId: string
  subscriptionName: string
  billingTime: 'anniversary' | 'calendar'
  startDate: string
  endDate: string
}

export interface InvoicingSettings {
  paymentMethodId: string
  invoiceCustomFooter: string
}

export const DEFAULT_SUBSCRIPTION_SETTINGS: SubscriptionSettings = {
  externalId: '',
  subscriptionName: '',
  billingTime: 'anniversary',
  startDate: '',
  endDate: '',
}

export const DEFAULT_INVOICING_SETTINGS: InvoicingSettings = {
  paymentMethodId: '',
  invoiceCustomFooter: '',
}

// --- Serialization state (passed to toPlanBillingItems) ---

export interface SubscriptionPricingState {
  planId: string
  planCode: string
  planName: string
  planDescription: string
  subscriptionSettings: SubscriptionSettings
  invoicingSettings: InvoicingSettings
  // Optional: overrides are derived from form state by `toPlanBillingItems`.
  // Kept as a fallback for callers that serialize without form values.
  overrides?: PlanOverrides
}

// --- Serializer / Deserializer ---

const normalizeOptional = (value: string): string | null => (value === '' ? null : value)

const serializeTaxes = (
  taxes: Array<{ id: string; code: string; name: string; rate: number }> | null | undefined,
): SerializedTax[] => {
  if (!taxes) return []
  return taxes.map((t) => ({ id: t.id, code: t.code, name: t.name, rate: t.rate }))
}

const serializeCharge = (charge: LocalUsageChargeInput): SerializedCharge => {
  const bm = charge.billableMetric

  return {
    id: charge.id,
    billableMetric: {
      id: bm.id,
      code: bm.code,
      name: bm.name,
      aggregationType: bm.aggregationType,
      recurring: bm.recurring,
      filters: (bm.filters ?? []).map((f) => ({ id: f.id, key: f.key, values: [...f.values] })),
    },
    chargeModel: charge.chargeModel,
    properties: charge.properties ?? {},
    invoiceDisplayName: charge.invoiceDisplayName ?? '',
    minAmountCents: charge.minAmountCents === null ? undefined : String(charge.minAmountCents),
    payInAdvance: charge.payInAdvance ?? false,
    prorated: charge.prorated ?? false,
    regroupPaidFees: (charge.regroupPaidFees as string) ?? null,
    invoiceable: charge.invoiceable ?? true,
    taxCodes: charge.taxCodes ?? [],
    taxes: serializeTaxes(charge.taxes),
    filters: (charge.filters ?? []).map((f) => ({
      invoiceDisplayName: (f.invoiceDisplayName as string | null) ?? null,
      properties: f.properties ?? {},
      values: f.values ?? [],
    })),
    appliedPricingUnit: charge.appliedPricingUnit
      ? {
          code: charge.appliedPricingUnit.code,
          shortName: charge.appliedPricingUnit.shortName,
          type: String(charge.appliedPricingUnit.type),
          conversionRate: charge.appliedPricingUnit.conversionRate ?? '',
        }
      : null,
  }
}

const serializeFixedCharge = (charge: LocalFixedChargeInput): SerializedFixedCharge => {
  return {
    id: charge.id,
    addOn: {
      id: charge.addOn.id,
      name: charge.addOn.name,
      code: charge.addOn.code,
    },
    chargeModel: charge.chargeModel,
    units: (charge.units as string) ?? '',
    applyUnitsImmediately: charge.applyUnitsImmediately ?? false,
    invoiceDisplayName: (charge.invoiceDisplayName as string | null) ?? null,
    payInAdvance: charge.payInAdvance ?? false,
    prorated: charge.prorated ?? false,
    properties: charge.properties ?? {},
    taxCodes: charge.taxCodes ?? [],
    taxes: serializeTaxes(charge.taxes),
  }
}

/**
 * Builds the camelCase `overrides` payload from the plan form state.
 *
 * This is the single source of truth for the form → override mapping: it is
 * derived from the same `PlanFormInput` that feeds the plan `payload`, so the
 * two can't silently drift when a charge field is added.
 */
export const buildPlanOverrides = (formValues: PlanFormInput): PlanOverrides => {
  const overrides: PlanOverrides = {}

  // Form amounts are in currency units (e.g. "10" for $10); the backend
  // contract expects cents. Convert with the plan currency before writing.
  const currency = (formValues.amountCurrency as CurrencyEnum) ?? CurrencyEnum.Usd

  // Subscription fee
  overrides.amountCents = Number(formValues.amountCents)
    ? serializeAmount(formValues.amountCents, currency)
    : undefined
  if (formValues.invoiceDisplayName) {
    overrides.invoiceDisplayName = formValues.invoiceDisplayName || undefined
  }

  // Fixed charges
  if (formValues.fixedCharges?.length) {
    overrides.charges = [
      ...formValues.fixedCharges.map((c) => ({
        billableMetricCode: c.addOn?.code ?? '',
        chargeModel: c.chargeModel,
        properties: c.properties ?? {},
      })),
    ]
  }

  // Usage charges
  if (formValues.charges?.length) {
    overrides.charges = [
      ...(overrides.charges ?? []),
      ...formValues.charges.map((c) => ({
        billableMetricCode: c.billableMetric?.code ?? '',
        chargeModel: c.chargeModel,
        properties: c.properties ?? {},
      })),
    ]
  }

  // Minimum commitment
  const mcAmount = formValues.minimumCommitment?.amountCents

  if (mcAmount && !Number.isNaN(Number(mcAmount)) && Number(mcAmount) > 0) {
    overrides.minimumCommitment = {
      amountCents: serializeAmount(mcAmount, currency),
      invoiceDisplayName: formValues.minimumCommitment?.invoiceDisplayName || undefined,
    }
  }

  // Progressive billing (usage thresholds)
  const thresholds = [
    ...(formValues.nonRecurringUsageThresholds ?? []).map((t) => ({
      amountCents: serializeAmount(t.amountCents, currency),
      recurring: false as const,
      thresholdDisplayName: t.thresholdDisplayName ?? undefined,
    })),
    ...(formValues.recurringUsageThreshold
      ? [
          {
            amountCents: serializeAmount(formValues.recurringUsageThreshold.amountCents, currency),
            recurring: true as const,
            thresholdDisplayName:
              formValues.recurringUsageThreshold.thresholdDisplayName ?? undefined,
          },
        ]
      : []),
  ]

  if (thresholds.length) {
    overrides.usageThresholds = thresholds
  }

  return overrides
}

export const toPlanBillingItems = (
  state: SubscriptionPricingState,
  formValues?: PlanFormInput,
): { plans: BillingItemPlan[] } => {
  const { planId, planCode, planName, planDescription, subscriptionSettings, invoicingSettings } =
    state

  // Derive overrides from the form values (single source of truth). Fall back to
  // any pre-built overrides on the state for callers that serialize without form values.
  const overrides = formValues ? buildPlanOverrides(formValues) : (state.overrides ?? {})

  const payload: PlanPayload = {
    position: 1,
    code: planCode,
    name: planName,
    description: planDescription,
    subscriptionExternalId: normalizeOptional(subscriptionSettings.externalId),
    subscriptionName: normalizeOptional(subscriptionSettings.subscriptionName),
    billingTime: subscriptionSettings.billingTime,
    startDate: normalizeOptional(subscriptionSettings.startDate),
    endDate: normalizeOptional(subscriptionSettings.endDate),
    paymentMethodId: normalizeOptional(invoicingSettings.paymentMethodId),
    invoiceCustomFooter: normalizeOptional(invoicingSettings.invoiceCustomFooter),
  }

  if (formValues) {
    const currency = (formValues.amountCurrency as CurrencyEnum) ?? CurrencyEnum.Usd
    // Form amounts are currency units; persist cents per the backend contract.
    const toCentsString = (value: string | number | null | undefined): string =>
      value === '' || value === null || value === undefined
        ? ''
        : String(serializeAmount(value, currency))

    payload.interval = formValues.interval
    payload.amountCents = toCentsString(formValues.amountCents)
    payload.amountCurrency = formValues.amountCurrency
    payload.payInAdvance = formValues.payInAdvance ?? false
    payload.billChargesMonthly = formValues.billChargesMonthly ?? null
    payload.billFixedChargesMonthly = formValues.billFixedChargesMonthly ?? null
    payload.trialPeriod = formValues.trialPeriod ?? 0
    payload.invoiceDisplayName = formValues.invoiceDisplayName ?? null
    payload.taxCodes = formValues.taxCodes ?? []
    payload.taxes = serializeTaxes(formValues.taxes)
    payload.charges = (formValues.charges ?? []).map(serializeCharge)
    payload.fixedCharges = (formValues.fixedCharges ?? []).map(serializeFixedCharge)
    payload.minimumCommitment = formValues.minimumCommitment
      ? {
          id: formValues.minimumCommitment.id ?? undefined,
          amountCents: toCentsString(formValues.minimumCommitment.amountCents),
          invoiceDisplayName:
            (formValues.minimumCommitment.invoiceDisplayName as string | null) ?? null,
          commitmentType: String(
            formValues.minimumCommitment.commitmentType ?? 'minimum_commitment',
          ),
          taxCodes: formValues.minimumCommitment.taxCodes ?? [],
          taxes: serializeTaxes(formValues.minimumCommitment.taxes),
        }
      : null
    payload.nonRecurringUsageThresholds = (formValues.nonRecurringUsageThresholds ?? []).map(
      (t) => ({
        id: undefined,
        amountCents: serializeAmount(t.amountCents, currency),
        thresholdDisplayName: (t.thresholdDisplayName as string | null) ?? null,
        recurring: t.recurring ?? false,
      }),
    )
    payload.recurringUsageThreshold = formValues.recurringUsageThreshold
      ? {
          id: undefined,
          amountCents: serializeAmount(formValues.recurringUsageThreshold.amountCents, currency),
          thresholdDisplayName:
            (formValues.recurringUsageThreshold.thresholdDisplayName as string | null) ?? null,
          recurring: formValues.recurringUsageThreshold.recurring ?? true,
        }
      : null
  }

  return { plans: [{ type: 'plan', id: planId, payload, overrides }] }
}

interface FromPlanBillingItemsResult {
  planId: string
  planCode: string
  planName: string
  planDescription: string
  subscriptionSettings: SubscriptionSettings
  invoicingSettings: InvoicingSettings
  overrides: PlanOverrides
  entityData: Record<string, EntityData>
  formValues: PlanFormInput | null
}

const denormalizeOptional = (value: string | null): string => value ?? ''

const deserializeTaxes = (
  taxes: SerializedTax[],
): Array<{ id: string; code: string; name: string; rate: number }> => {
  return taxes.map((t) => ({ id: t.id, code: t.code, name: t.name, rate: t.rate }))
}

const deserializeCharge = (charge: SerializedCharge): LocalUsageChargeInput => {
  const bm = charge.billableMetric

  return {
    id: charge.id,
    billableMetric: {
      id: bm.id,
      code: bm.code,
      name: bm.name,
      aggregationType: bm.aggregationType,
      recurring: bm.recurring,
      filters: bm.filters.map((f) => ({ id: f.id, key: f.key, values: f.values })),
    } as LocalUsageChargeInput['billableMetric'],
    chargeModel: charge.chargeModel as LocalUsageChargeInput['chargeModel'],
    properties: charge.properties,
    invoiceDisplayName: charge.invoiceDisplayName ?? undefined,
    minAmountCents: charge.minAmountCents as LocalUsageChargeInput['minAmountCents'],
    payInAdvance: charge.payInAdvance,
    prorated: charge.prorated,
    regroupPaidFees: charge.regroupPaidFees as LocalUsageChargeInput['regroupPaidFees'],
    invoiceable: charge.invoiceable,
    taxCodes: charge.taxCodes,
    taxes: deserializeTaxes(charge.taxes),
    filters: charge.filters.map((f) => ({
      invoiceDisplayName: f.invoiceDisplayName ?? undefined,
      properties: f.properties,
      values: f.values,
    })) as LocalUsageChargeInput['filters'],
    appliedPricingUnit: charge.appliedPricingUnit
      ? ({
          code: charge.appliedPricingUnit.code,
          shortName: charge.appliedPricingUnit.shortName,
          type: charge.appliedPricingUnit.type,
          conversionRate: charge.appliedPricingUnit.conversionRate,
        } as LocalUsageChargeInput['appliedPricingUnit'])
      : undefined,
  }
}

const deserializeFixedCharge = (charge: SerializedFixedCharge): LocalFixedChargeInput => {
  return {
    id: charge.id,
    addOn: {
      id: charge.addOn.id,
      name: charge.addOn.name,
      code: charge.addOn.code,
    },
    chargeModel: charge.chargeModel as LocalFixedChargeInput['chargeModel'],
    units: charge.units,
    applyUnitsImmediately: charge.applyUnitsImmediately,
    invoiceDisplayName: charge.invoiceDisplayName ?? undefined,
    payInAdvance: charge.payInAdvance,
    prorated: charge.prorated,
    properties: charge.properties,
    taxCodes: charge.taxCodes,
    taxes: deserializeTaxes(charge.taxes),
  }
}

export const fromPlanBillingItems = (plans: BillingItemPlan[]): FromPlanBillingItemsResult => {
  const plan = plans[0]
  const { payload, overrides, id } = plan

  const subscriptionSettings: SubscriptionSettings = {
    externalId: denormalizeOptional(payload.subscriptionExternalId),
    subscriptionName: denormalizeOptional(payload.subscriptionName),
    billingTime: payload.billingTime,
    startDate: denormalizeOptional(payload.startDate),
    endDate: denormalizeOptional(payload.endDate),
  }

  const invoicingSettings: InvoicingSettings = {
    paymentMethodId: denormalizeOptional(payload.paymentMethodId),
    invoiceCustomFooter: denormalizeOptional(payload.invoiceCustomFooter),
  }

  // Backward-compat: legacy payloads don't have interval/charges
  const hasFullPlanData =
    'interval' in payload &&
    payload.interval !== null &&
    'charges' in payload &&
    payload.charges !== null

  let formValues: PlanFormInput | null = null

  if (hasFullPlanData) {
    // Payload stores cents; the plan form expects currency units.
    const currency = (payload.amountCurrency as CurrencyEnum) ?? CurrencyEnum.Usd

    formValues = {
      interval: payload.interval as PlanFormInput['interval'],
      amountCents: String(
        deserializeAmount(payload.amountCents || 0, currency),
      ) as PlanFormInput['amountCents'],
      amountCurrency: payload.amountCurrency as PlanFormInput['amountCurrency'],
      payInAdvance: payload.payInAdvance ?? false,
      billChargesMonthly: payload.billChargesMonthly ?? undefined,
      billFixedChargesMonthly: payload.billFixedChargesMonthly ?? undefined,
      trialPeriod: payload.trialPeriod,
      invoiceDisplayName: payload.invoiceDisplayName ?? undefined,
      taxCodes: payload.taxCodes ?? [],
      taxes: deserializeTaxes(payload.taxes ?? []),
      charges: (payload.charges ?? []).map(deserializeCharge),
      fixedCharges: (payload.fixedCharges ?? []).map(deserializeFixedCharge),
      minimumCommitment: payload.minimumCommitment
        ? {
            id: payload.minimumCommitment.id ?? undefined,
            amountCents: String(
              deserializeAmount(payload.minimumCommitment.amountCents || 0, currency),
            ),
            invoiceDisplayName: payload.minimumCommitment.invoiceDisplayName ?? undefined,
            commitmentType: payload.minimumCommitment.commitmentType as CommitmentTypeEnum,
            taxCodes: payload.minimumCommitment.taxCodes ?? [],
            taxes: deserializeTaxes(payload.minimumCommitment.taxes ?? []),
          }
        : undefined,
      nonRecurringUsageThresholds: (payload.nonRecurringUsageThresholds ?? []).map((t) => ({
        amountCents: deserializeAmount(t.amountCents || 0, currency),
        thresholdDisplayName: t.thresholdDisplayName ?? undefined,
        recurring: t.recurring,
      })) as PlanFormInput['nonRecurringUsageThresholds'],
      recurringUsageThreshold: payload.recurringUsageThreshold
        ? {
            amountCents: deserializeAmount(
              payload.recurringUsageThreshold.amountCents || 0,
              currency,
            ),
            thresholdDisplayName: payload.recurringUsageThreshold.thresholdDisplayName ?? undefined,
            recurring: payload.recurringUsageThreshold.recurring,
          }
        : undefined,
      entitlements: [],
      name: payload.name,
      code: payload.code,
      description: payload.description,
    }
  }

  const entityData: Record<string, EntityData> = {
    [id]: {
      entityId: id,
      entityType: 'plan',
      name: payload.name,
      code: payload.code,
      plan: buildPlanPreviewData(formValues),
    },
  }

  return {
    planId: id,
    planCode: payload.code,
    planName: payload.name,
    planDescription: payload.description,
    subscriptionSettings,
    invoicingSettings,
    overrides,
    entityData,
    formValues,
  }
}
