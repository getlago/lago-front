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
  UsageThresholdInput,
} from '~/generated/graphql'

type LocalCommitmentInput = Omit<CommitmentInput, 'taxCodes'> & {
  taxes?: TaxForPlanAndChargesInPlanFormFragment[] | null
}

export type LocalChargeFilterInput = Omit<ChargeFilterInput, 'properties' | 'values'> & {
  properties: PropertiesInput
  values: string[] // This value should be defined using transformFilterObjectToString method
}

export type LocalChargeInput = Omit<ChargeInput, 'billableMetricId' | 'filters' | 'properties'> & {
  billableMetric: BillableMetricForPlanFragment
  id?: string
  properties?: PropertiesInput
  filters?: LocalChargeFilterInput[]
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanChargeAccordionFragment[] | null
}

export type LocalUsageThresholdInput = UsageThresholdInput

export type PlanFormInput = Omit<
  CreatePlanInput,
  'clientMutationId' | 'charges' | 'usageThresholds'
> & {
  charges: LocalChargeInput[]
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxForPlanSettingsSectionFragment[]
  minimumCommitment?: LocalCommitmentInput
  // NOTE: this is used for display purpose but will be replaced by usageThresholds[] on save
  nonRecurringUsageThresholds?: LocalUsageThresholdInput[]
  recurringUsageThreshold?: LocalUsageThresholdInput
  cascadeUpdates?: boolean
}
