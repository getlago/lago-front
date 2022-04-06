import { ChargeInput, BillableMetricForPlanFragment, CreatePlanInput } from '~/generated/graphql'

export type LocalChargeInput = Omit<ChargeInput, 'billableMetricId'> & {
  billableMetric: BillableMetricForPlanFragment
}

export interface PlanForm extends Omit<CreatePlanInput, 'clientMutationId' | 'charges'> {
  charges: LocalChargeInput[]
}
