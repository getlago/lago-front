import { AppliedRateCardContext } from './types'

export const APPLIED_RATE_CARD_CONTEXT_CONFIG = {
  plan: {
    parentTypename: 'CatalogPlan',
    updatePermission: 'plansUpdate',
    alreadyPricedTranslationKey: 'text_1792683486646v7np3oh22jc',
  },
  contract: {
    parentTypename: 'Contract',
    updatePermission: 'contractsUpdate',
    alreadyPricedTranslationKey: 'text_1792683486646r8re8d0scxh',
  },
} as const

// Renaming either details query silently stops these by-name refetches.
export const RATE_PHASE_REFETCH_QUERIES: Record<AppliedRateCardContext, string[]> = {
  plan: ['getPlanAppliedRateCardForDetails'],
  contract: ['getContractAppliedRateCardForDetails'],
}

// Renaming the apply drawer's rate cards query silently stops this by-name refetch.
export const ALREADY_PRICED_REFETCH_QUERIES = ['getRateCardsForAppliedRateCardDrawer']
