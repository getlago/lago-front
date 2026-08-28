import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { RateCardRateDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { RATE_CARD_RATE_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { RateCardForRateDrawerFragment, RateCardRateForListFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteRateCardRateDialog } from './dialogs/useDeleteRateCardRateDialog'
import {
  RATE_CARD_RATE_DELETE_ACTION_KEY,
  RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY,
  RATE_CARD_RATE_VIEW_ACTION_KEY,
} from './drawers/rateCardRate/constants'
import {
  OpenRateCardRateDrawerArgs,
  useRateCardRateDrawer,
} from './drawers/rateCardRate/useRateCardRateDrawer'
import { isRateCardRateDeletable, isRateCardRateEditable } from './drawers/rateCardRate/utils'

export const buildRateCardRateDetailsPath = ({
  rateCardId,
  rateId,
}: {
  rateCardId: string
  rateId: string
}): string =>
  generatePath(RATE_CARD_RATE_DETAILS_ROUTE, {
    rateCardId,
    rateId,
    tab: RateCardRateDetailsTabsOptionsEnum.overview,
  })

type UseRateCardRateTableActionsProps = {
  rateCardId: string
  // Undefined while the parent card query is in flight; write actions appear once it lands.
  rateCard?: RateCardForRateDrawerFragment | null
}

type UseRateCardRateTableActionsReturn = {
  actionColumn: ActionColumn<RateCardRateForListFragment>
  actionColumnTooltip: (rate: RateCardRateForListFragment) => string
  getRowActionLink: (rate: { id: string }) => string
  openRateDrawer: (args: OpenRateCardRateDrawerArgs) => void
}

export const useRateCardRateTableActions = ({
  rateCardId,
  rateCard,
}: UseRateCardRateTableActionsProps): UseRateCardRateTableActionsReturn => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openRateDrawer } = useRateCardRateDrawer()
  const { openDeleteRateCardRateDialog } = useDeleteRateCardRateDialog()

  const canUpdateRateCards = hasPermissions(['rateCardsUpdate'])
  const canDeleteRateCards = hasPermissions(['rateCardsDelete'])

  const actionColumnTooltip = useCallback(
    (rate: RateCardRateForListFragment): string => {
      const label = [
        translate(RATE_CARD_RATE_VIEW_ACTION_KEY).toLowerCase(),
        canUpdateRateCards &&
          !!rateCard &&
          isRateCardRateEditable({ rate, rateCard }) &&
          translate(RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY).toLowerCase(),
        canDeleteRateCards &&
          isRateCardRateDeletable(rate) &&
          translate(RATE_CARD_RATE_DELETE_ACTION_KEY).toLowerCase(),
      ]
        .filter(Boolean)
        .join(', ')

      return label.charAt(0).toUpperCase() + label.slice(1)
    },
    [canUpdateRateCards, canDeleteRateCards, rateCard, translate],
  )

  const getRowActionLink = useCallback(
    ({ id }: { id: string }): string => buildRateCardRateDetailsPath({ rateCardId, rateId: id }),
    [rateCardId],
  )

  const actionColumn: ActionColumn<RateCardRateForListFragment> = (rate) => {
    const actions: ActionItem<RateCardRateForListFragment>[] = [
      {
        startIcon: 'eye',
        title: translate(RATE_CARD_RATE_VIEW_ACTION_KEY),
        onAction: () => navigate(buildRateCardRateDetailsPath({ rateCardId, rateId: rate.id })),
      },
    ]

    if (canUpdateRateCards && !!rateCard && isRateCardRateEditable({ rate, rateCard })) {
      actions.push({
        startIcon: 'pen',
        title: translate(RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY),
        onAction: () => openRateDrawer({ rateCard, rate }),
      })
    }

    if (canDeleteRateCards && isRateCardRateDeletable(rate)) {
      actions.push({
        startIcon: 'trash',
        title: translate(RATE_CARD_RATE_DELETE_ACTION_KEY),
        onAction: () => openDeleteRateCardRateDialog({ rate }),
      })
    }

    return actions
  }

  return { actionColumn, actionColumnTooltip, getRowActionLink, openRateDrawer }
}
