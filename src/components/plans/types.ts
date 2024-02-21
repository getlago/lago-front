import {
  BillableMetricForPlanFragment,
  ChargeInput,
  CommitmentInput,
  CreatePlanInput,
  GroupPropertiesInput,
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

export type LocalChargeInput = Omit<ChargeInput, 'billableMetricId'> & {
  billableMetric: BillableMetricForPlanFragment
  id?: string
  properties?: LocalPropertiesInput
  groupProperties?: Omit<GroupPropertiesInput, 'values'> &
    {
      values: LocalPropertiesInput
    }[]
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanChargeAccordionFragment[] | null
}

export interface PlanFormInput extends Omit<CreatePlanInput, 'clientMutationId' | 'charges'> {
  charges: LocalChargeInput[]
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanSettingsSectionFragment[]
  minimumCommitment?: LocalCommitmentInput
}
