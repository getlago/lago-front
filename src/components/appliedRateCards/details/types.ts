import {
  ContractAppliedRateCardForDetailsFragment,
  PlanAppliedRateCardForDetailsFragment,
} from '~/generated/graphql'

export type AppliedRateCardParent = {
  id: string
  name: string
  isLocked: boolean
}

export type AppliedRateCardDetailsData =
  | {
      context: 'plan'
      parent: AppliedRateCardParent
      appliedRateCard: PlanAppliedRateCardForDetailsFragment
    }
  | {
      context: 'contract'
      parent: AppliedRateCardParent
      appliedRateCard: ContractAppliedRateCardForDetailsFragment
    }
