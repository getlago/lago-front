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
  isRateCardRateDeletable,
  isRateCardRateEditable,
  RATE_CARD_RATE_DELETE_ACTION_KEY,
  RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY,
  RATE_CARD_RATE_VIEW_ACTION_KEY,
} from './drawers/rateCardRate/constants'
import { useRateCardRateDrawer } from './drawers/rateCardRate/useRateCardRateDrawer'

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

/**
 * Row actions and row link for the rate card's rates tab. Which actions a row offers is
 * dictated by what the backend accepts for that rate: an effective or terminated rate keeps
 * its pricing history, so only a pending rate can be deleted, and a terminated one (or any
 * non-pending rate on a card billed by subscriptions) cannot be edited at all.
 */
export const useRateCardRateTableActions = ({
  rateCard,
}: {
  rateCard: RateCardForRateDrawerFragment
}) => {
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
          isRateCardRateEditable({ rate, rateCard }) &&
          translate(RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY).toLowerCase(),
        canDeleteRateCards &&
          isRateCardRateDeletable(rate) &&
          translate(RATE_CARD_RATE_DELETE_ACTION_KEY).toLowerCase(),
      ]
        .filter(Boolean)
        .join(', ')

      // uppercase first letter
      return label.charAt(0).toUpperCase() + label.slice(1)
    },
    [canUpdateRateCards, canDeleteRateCards, rateCard, translate],
  )

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      buildRateCardRateDetailsPath({ rateCardId: rateCard.id, rateId: id }),
    [rateCard.id],
  )

  const actionColumn: ActionColumn<RateCardRateForListFragment> = (rate) => {
    const actions: ActionItem<RateCardRateForListFragment>[] = [
      {
        startIcon: 'eye',
        title: translate(RATE_CARD_RATE_VIEW_ACTION_KEY),
        onAction: () =>
          navigate(buildRateCardRateDetailsPath({ rateCardId: rateCard.id, rateId: rate.id })),
      },
    ]

    if (canUpdateRateCards && isRateCardRateEditable({ rate, rateCard })) {
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

  return { actionColumn, actionColumnTooltip, getRowActionLink }
}
