import { AppliedRateCardContext } from './types'

// `PlanRateCards::DestroyService` rejects a plan attached to contracts (`plan_locked`),
// `ContractRateCards::DestroyService` rejects a non-pending contract (`contract_locked`).
export const APPLIED_RATE_CARD_CONTEXT_CONFIG = {
  plan: {
    parentTypename: 'CatalogPlan',
    updatePermission: 'plansUpdate',
  },
  contract: {
    parentTypename: 'Contract',
    updatePermission: 'contractsUpdate',
  },
} as const

// Renaming either details query silently stops these by-name refetches.
export const RATE_PHASE_REFETCH_QUERIES: Record<AppliedRateCardContext, string[]> = {
  plan: ['getPlanAppliedRateCardForDetails'],
  contract: ['getContractAppliedRateCardForDetails'],
}
