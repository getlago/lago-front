import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { addToast } from '~/core/apolloClient'
import { CatalogPlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { CATALOG_PLAN_DETAILS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CatalogPlanForCatalogPlanDrawerFragment,
  CatalogPlanForDeleteCatalogPlanDialogFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteCatalogPlanDialog } from './dialogs/useDeleteCatalogPlanDialog'
import { useCatalogPlanDrawer } from './drawers/catalogPlan/useCatalogPlanDrawer'

// Not the list fragment: the details page spreads these same two fragments into a
// different generated type, so only the intersection is assignable to both.
export type CatalogPlanActionTarget = CatalogPlanForCatalogPlanDrawerFragment &
  CatalogPlanForDeleteCatalogPlanDialogFragment

export const useCatalogPlanTableActions = (): {
  actionColumn: ActionColumn<CatalogPlanActionTarget>
  actionColumnTooltip: () => string
  getRowActionLink: (plan: { id: string }) => string
  buildActionItems: (
    catalogPlan: CatalogPlanActionTarget,
    callbacks?: { onDeleted?: () => void },
  ) => Array<ActionItem<CatalogPlanActionTarget> & { title: string }>
} => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openCatalogPlanDrawer } = useCatalogPlanDrawer()
  const { openDeleteCatalogPlanDialog } = useDeleteCatalogPlanDialog()

  const canUpdateCatalogPlans = hasPermissions(['plansUpdate'])
  const canDeleteCatalogPlans = hasPermissions(['plansDelete'])

  const actionColumnTooltip = useCallback((): string => {
    const label = [
      translate('text_17890300495282w8aw4i2783').toLowerCase(),
      canUpdateCatalogPlans && translate('text_1789030049528hmelti5lsxj').toLowerCase(),
      canDeleteCatalogPlans && translate('text_1789030049528pjeaakmg1nc').toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [canUpdateCatalogPlans, canDeleteCatalogPlans, translate])

  const getRowActionLink = useCallback(
    ({ id }: { id: string }): string =>
      generatePath(CATALOG_PLAN_DETAILS_ROUTE, {
        catalogPlanId: id,
        tab: CatalogPlanDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const buildActionItems = useCallback(
    (
      catalogPlan: CatalogPlanActionTarget,
      callbacks?: { onDeleted?: () => void },
    ): Array<ActionItem<CatalogPlanActionTarget> & { title: string }> => {
      const items: Array<ActionItem<CatalogPlanActionTarget> & { title: string }> = [
        {
          startIcon: 'duplicate',
          title: translate('text_17890300495282w8aw4i2783'),
          onAction: ({ code }) => {
            copyToClipboard(code)
            addToast({ severity: 'info', message: translate('text_1789030049528x3nlpl7hu7x') })
          },
        },
      ]

      if (canUpdateCatalogPlans) {
        items.push({
          startIcon: 'pen',
          title: translate('text_1789030049528hmelti5lsxj'),
          onAction: (plan) => openCatalogPlanDrawer(plan),
        })
      }

      if (canDeleteCatalogPlans) {
        items.push({
          startIcon: 'trash',
          title: translate('text_1789030049528pjeaakmg1nc'),
          // `CatalogPlans::DestroyService` rejects a contracted plan with `plan_locked`;
          // disable here instead of letting delete fail after the click.
          disabled: catalogPlan.attachedToContracts,
          ...(catalogPlan.attachedToContracts && {
            tooltip: translate('text_1789030049528ow0evnxq68g'),
          }),
          onAction: (plan) =>
            openDeleteCatalogPlanDialog({ catalogPlan: plan, callback: callbacks?.onDeleted }),
        })
      }

      return items
    },
    [
      canUpdateCatalogPlans,
      canDeleteCatalogPlans,
      translate,
      openCatalogPlanDrawer,
      openDeleteCatalogPlanDialog,
    ],
  )

  const actionColumn: ActionColumn<CatalogPlanActionTarget> = (catalogPlan) =>
    buildActionItems(catalogPlan)

  return { actionColumn, actionColumnTooltip, getRowActionLink, buildActionItems }
}
