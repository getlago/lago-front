import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { RateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { RATE_CARD_DETAILS_ROUTE } from '~/core/router'
import { RateCardForListFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteRateCardDialog } from './dialogs/useDeleteRateCardDialog'
import { useRateCardDrawer } from './drawers/rateCard/useRateCardDrawer'

// Row actions, action-column tooltip and row link shared between the standalone
// rate-cards list (Task 8) and the product-item / product-item-filter details
// previews (Task 10) so the two can't drift. The delete action passes no
// callback: the dialog evicts the rate card from the cached list, so the row
// disappears without waiting for a refetch.
export const useRateCardTableActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openRateCardDrawer } = useRateCardDrawer()
  const { openDeleteRateCardDialog } = useDeleteRateCardDialog()

  const canUpdateRateCards = hasPermissions(['rateCardsUpdate'])
  const canDeleteRateCards = hasPermissions(['rateCardsDelete'])

  const actionColumnTooltip = useCallback((): string => {
    const label = [
      canUpdateRateCards && translate('text_629728388c4d2300e2d3816a').toLowerCase(),
      canDeleteRateCards && translate('text_629728388c4d2300e2d38182').toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    // uppercase first letter
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [canUpdateRateCards, canDeleteRateCards, translate])

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      generatePath(RATE_CARD_DETAILS_ROUTE, {
        rateCardId: id,
        tab: RateCardDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const actionColumn: ActionColumn<RateCardForListFragment> = (rateCard) => {
    const actions: ActionItem<RateCardForListFragment>[] = []

    if (canUpdateRateCards) {
      actions.push({
        startIcon: 'pen',
        title: translate('text_629728388c4d2300e2d3816a'),
        onAction: () => openRateCardDrawer({ rateCard }),
      })
    }

    if (canDeleteRateCards) {
      actions.push({
        startIcon: 'trash',
        title: translate('text_629728388c4d2300e2d38182'),
        onAction: () => openDeleteRateCardDialog({ rateCard }),
      })
    }

    return actions
  }

  return { actionColumn, actionColumnTooltip, getRowActionLink }
}
