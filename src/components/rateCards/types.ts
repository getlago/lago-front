import {
  ContractAppliedRateCardForAppliedRateCardsTableFragment,
  PlanAppliedRateCardForAppliedRateCardsTableFragment,
} from '~/generated/graphql'

export type AppliedRateCardRow =
  | PlanAppliedRateCardForAppliedRateCardsTableFragment
  | ContractAppliedRateCardForAppliedRateCardsTableFragment

export type AppliedRateCardContext = 'plan' | 'contract'

export type RateCardRemoval =
  { status: 'hidden' } | { status: 'enabled' } | { status: 'disabled'; tooltip: string }

export const STANDALONE_GROUP_KEY = '__standalone__'
