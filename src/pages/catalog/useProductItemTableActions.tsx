import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { ProductItemDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_ITEM_DETAILS_ROUTE } from '~/core/router'
import { ProductItemForListFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteProductItemDialog } from './dialogs/useDeleteProductItemDialog'
import { useProductItemDrawer } from './drawers/productItem/useProductItemDrawer'

// Row actions, action-column tooltip and row link shared between the standalone
// product-items list and the product-details preview so the two can't drift.
// The delete action passes no callback: the dialog evicts the item from the
// cached list, so the row disappears without waiting for a refetch.
export const useProductItemTableActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductItemDrawer } = useProductItemDrawer()
  const { openDeleteProductItemDialog } = useDeleteProductItemDialog()

  const canUpdateProductItems = hasPermissions(['productItemsUpdate'])
  const canDeleteProductItems = hasPermissions(['productItemsDelete'])

  const actionColumnTooltip = useCallback((): string => {
    const label = [
      canUpdateProductItems && translate('text_629728388c4d2300e2d3816a').toLowerCase(),
      canDeleteProductItems && translate('text_629728388c4d2300e2d38182').toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    // uppercase first letter
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [canUpdateProductItems, canDeleteProductItems, translate])

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      generatePath(PRODUCT_ITEM_DETAILS_ROUTE, {
        productItemId: id,
        tab: ProductItemDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const actionColumn: ActionColumn<ProductItemForListFragment> = (productItem) => {
    const actions: ActionItem<ProductItemForListFragment>[] = []

    if (canUpdateProductItems) {
      actions.push({
        startIcon: 'pen',
        title: translate('text_629728388c4d2300e2d3816a'),
        onAction: () => openProductItemDrawer({ productItem }),
      })
    }

    if (canDeleteProductItems) {
      actions.push({
        startIcon: 'trash',
        title: translate('text_629728388c4d2300e2d38182'),
        onAction: () => openDeleteProductItemDialog({ productItem }),
      })
    }

    return actions
  }

  return { actionColumn, actionColumnTooltip, getRowActionLink }
}
