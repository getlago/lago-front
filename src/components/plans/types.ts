import {
  BillableMetricForPlanFragment,
  ChargeFilterInput,
  ChargeInput,
  CommitmentInput,
  CreatePlanInput,
  PropertiesInput,
  TaxForPlanAndChargesInPlanFormFragment,
  TaxForPlanChargeAccordionFragment,
  TaxForPlanSettingsSectionFragment,
} from '~/generated/graphql'

type LocalCommitmentInput = Omit<CommitmentInput, 'taxCodes'> & {
  taxes?: TaxForPlanAndChargesInPlanFormFragment[] | null
}

export type LocalPropertiesInput = Omit<PropertiesInput, 'groupedBy'> & {
  // NOTE: this is used for display purpose but will be replaced by string[] on save
  groupedBy?: string | null
}

export type LocalChargeFilterInput = Omit<ChargeFilterInput, 'properties' | 'values'> & {
  properties: LocalPropertiesInput
  values: string[] // This value should be defined using transformFilterObjectToString method
}

export type LocalChargeInput = Omit<ChargeInput, 'billableMetricId' | 'filters' | 'properties'> & {
  billableMetric: BillableMetricForPlanFragment
  id?: string
  properties?: LocalPropertiesInput
  filters?: LocalChargeFilterInput[]
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanChargeAccordionFragment[] | null
}

export type PlanFormInput = Omit<CreatePlanInput, 'clientMutationId' | 'charges'> & {
  charges: LocalChargeInput[]
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanSettingsSectionFragment[]
  minimumCommitment?: LocalCommitmentInput
}
