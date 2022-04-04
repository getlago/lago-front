import {
  ChargeInput,
  BillableMetricForPlanFragment,
  CurrencyEnum,
  PlanFrequency,
  BillingPeriodEnum,
} from '~/generated/graphql'

export type LocalChargeInput = Omit<ChargeInput, 'billableMetricId'> & {
  billableMetric: BillableMetricForPlanFragment
}

export interface PlanForm {
  name: string
  code: string
  description: string
  frequency: PlanFrequency
  billingPeriod: BillingPeriodEnum
  amountCents: number
  amountCurrency: CurrencyEnum
  vatRate?: number
  trialPeriod: number
  proRata: boolean
  charges: LocalChargeInput[]
}
