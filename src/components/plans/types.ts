import { ChargeInput, BillableMetricForPlanFragment, CreatePlanInput } from '~/generated/graphql'

export type LocalChargeInput = Omit<ChargeInput, 'billableMetricId'> & {
  billableMetric: BillableMetricForPlanFragment
  id?: string
}

export type PlanFormInput = Omit<CreatePlanInput, 'clientMutationId' | 'charges'> & {
  charges: LocalChargeInput[]
}
