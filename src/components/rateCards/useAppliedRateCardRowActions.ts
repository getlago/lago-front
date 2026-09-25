import { useApolloClient } from '@apollo/client'

import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { usePermissions } from '~/hooks/usePermissions'

import { useRemoveAppliedRateCardDialog } from './dialogs/useRemoveAppliedRateCardDialog'
import { AppliedRateCardContext, AppliedRateCardRow, RateCardRemoval } from './types'

// `PlanRateCards::DestroyService` rejects a plan attached to contracts (`plan_locked`),
// `ContractRateCards::DestroyService` rejects a non-pending contract (`contract_locked`).
const CONTEXT_CONFIG = {
  plan: {
    parentTypename: 'CatalogPlan',
    updatePermission: 'plansUpdate',
  },
  contract: {
    parentTypename: 'Contract',
    updatePermission: 'contractsUpdate',
  },
} as const

type UseAppliedRateCardRowActionsParams = {
  context: AppliedRateCardContext
  parentId: string
  isRemovalLocked: boolean
  onRemoved: () => void
}

type AppliedRateCardRowActions = {
  removal: RateCardRemoval
  copyRateCardCode: (row: AppliedRateCardRow) => void
  removeRateCard: (row: AppliedRateCardRow) => void
}

export const useAppliedRateCardRowActions = ({
  context,
  parentId,
  isRemovalLocked,
  onRemoved,
}: UseAppliedRateCardRowActionsParams): AppliedRateCardRowActions => {
  const { hasPermissions } = usePermissions()
  const client = useApolloClient()
  const { openRemoveAppliedRateCardDialog } = useRemoveAppliedRateCardDialog()
  const config = CONTEXT_CONFIG[context]

  const getRemoval = (): RateCardRemoval => {
    if (!hasPermissions([config.updatePermission])) return { status: 'hidden' }
    if (isRemovalLocked) return { status: 'disabled' }

    return { status: 'enabled' }
  }

  const copyRateCardCode = (row: AppliedRateCardRow): void => {
    copyToClipboard(row.rateCard.code)
    addToast({ severity: 'info', translateKey: 'text_1775559630554ourrtpgddty' })
  }

  const removeRateCard = (row: AppliedRateCardRow): void => {
    openRemoveAppliedRateCardDialog({
      context,
      id: row.id,
      rateCardName: row.rateCard.name,
      onRemoved: () => {
        onRemoved()

        client.cache.modify({
          id: client.cache.identify({ __typename: config.parentTypename, id: parentId }),
          fields: {
            appliedRateCardsCount: (existing = 0) => Math.max(existing - 1, 0),
          },
        })
      },
    })
  }

  return { removal: getRemoval(), copyRateCardCode, removeRateCard }
}
