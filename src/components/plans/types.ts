import {
  BillableMetricForPlanFragment,
  ChargeGroupInput,
  ChargeGroupForPlanFragment,
  ChargeInput,
  CreatePlanInput,
  TaxForPlanChargeAccordionFragment,
  TaxForPlanSettingsSectionFragment,
} from '~/generated/graphql'

export type LocalChargeInput = Omit<ChargeInput, 'billableMetricId'> & {
  billableMetric: BillableMetricForPlanFragment
  chargeGroup?: ChargeGroupForPlanFragment | null
  id?: string
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanChargeAccordionFragment[] | null
}

export type LocalChargeGroupInput = ChargeGroupInput & {
  id?: string
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanChargeAccordionFragment[] | null
}

export interface PlanFormInput extends Omit<CreatePlanInput, 'clientMutationId' | 'charges'> {
  charges: LocalChargeInput[]
  chargeGroups: LocalChargeGroupInput[]
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanSettingsSectionFragment[]
}
