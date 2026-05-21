import {
  CurrencyEnum,
  PlanInterval,
  TaxForPlanSettingsSectionFragment,
} from '~/generated/graphql'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatAnyToValueForChargeFormArrays = (toValue: any, fromValue: number | string) => {
  if (toValue === null) return null

  if (Number(toValue || 0) <= Number(fromValue)) {
    return Number(fromValue) + 1
  }

  return Number(toValue || 0)
}

type PlanSettingsSourceShape = {
  name?: string | null
  code?: string | null
  description?: string | null
  interval?: PlanInterval | null
  amountCurrency?: CurrencyEnum | null
  billChargesMonthly?: boolean | null
  billFixedChargesMonthly?: boolean | null
  taxes?: TaxForPlanSettingsSectionFragment[] | null
  fixedCharges?: Array<{ id: string }> | null
  charges?: Array<{ id: string }> | null
}

export type PlanSettingsValues = {
  name: string
  code: string
  description: string
  interval: PlanInterval
  amountCurrency: CurrencyEnum
  billChargesMonthly: boolean
  billFixedChargesMonthly: boolean
  taxes: TaxForPlanSettingsSectionFragment[]
  fixedCharges: Array<{ id: string }>
  charges: Array<{ id: string }>
}

export const buildPlanSettingsValues = (plan: PlanSettingsSourceShape): PlanSettingsValues => ({
  name: plan.name ?? '',
  code: plan.code ?? '',
  description: plan.description ?? '',
  interval: plan.interval ?? PlanInterval.Monthly,
  amountCurrency: plan.amountCurrency ?? CurrencyEnum.Usd,
  billChargesMonthly: plan.billChargesMonthly ?? false,
  billFixedChargesMonthly: plan.billFixedChargesMonthly ?? false,
  taxes: plan.taxes ?? [],
  fixedCharges: (plan.fixedCharges ?? []).map((fc) => ({ id: fc.id })),
  charges: (plan.charges ?? []).map((c) => ({ id: c.id })),
})
