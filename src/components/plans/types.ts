import {
  ChargeInput,
  BillableMetricForPlanFragment,
  CreatePlanInput,
  TaxForPlanChargeAccordionFragment,
  TaxForPlanSettingsSectionFragment,
} from '~/generated/graphql'

export type LocalChargeInput = Omit<ChargeInput, 'billableMetricId'> & {
  billableMetric: BillableMetricForPlanFragment
  id?: string
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanChargeAccordionFragment[] | null
}

export interface PlanFormInput extends Omit<CreatePlanInput, 'clientMutationId' | 'charges'> {
  charges: LocalChargeInput[]
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanSettingsSectionFragment[]
}
