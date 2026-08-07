import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { ProductDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_DETAILS_ROUTE } from '~/core/router'
import { ProductForListFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteProductDialog } from './dialogs/useDeleteProductDialog'
import { useProductDrawer } from './drawers/product/useProductDrawer'

// Row actions, action-column tooltip and row link shared between the standalone
// product-items list and the product-details preview so the two can't drift.
// The delete action passes no callback: the dialog evicts the item from the
// cached list, so the row disappears without waiting for a refetch.
export const useProductTableActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductDrawer } = useProductDrawer()
  const { openDeleteProductDialog } = useDeleteProductDialog()

  const canUpdateProducts = hasPermissions(['productsUpdate'])
  const canDeleteProducts = hasPermissions(['productsDelete'])

  const actionColumnTooltip = useCallback((): string => {
    const label = [
      canUpdateProducts && translate('text_629728388c4d2300e2d3816a').toLowerCase(),
      canDeleteProducts && translate('text_629728388c4d2300e2d38182').toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    // uppercase first letter
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [canUpdateProducts, canDeleteProducts, translate])

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      generatePath(PRODUCT_DETAILS_ROUTE, {
        productId: id,
        tab: ProductDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const actionColumn: ActionColumn<ProductForListFragment> = (product) => {
    const actions: ActionItem<ProductForListFragment>[] = []

    if (canUpdateProducts) {
      actions.push({
        startIcon: 'pen',
        title: translate('text_629728388c4d2300e2d3816a'),
        onAction: () => openProductDrawer({ product }),
      })
    }

    if (canDeleteProducts) {
      actions.push({
        startIcon: 'trash',
        title: translate('text_629728388c4d2300e2d38182'),
        onAction: () => openDeleteProductDialog({ product }),
      })
    }

    return actions
  }

  return { actionColumn, actionColumnTooltip, getRowActionLink }
}
