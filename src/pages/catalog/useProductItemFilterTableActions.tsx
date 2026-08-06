import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { ProductItemFilterDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_ITEM_FILTER_DETAILS_ROUTE } from '~/core/router'
import { ProductItemFilterForListFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteProductItemFilterDialog } from './dialogs/useDeleteProductItemFilterDialog'
import { useProductItemFilterDrawer } from './drawers/productItemFilter/useProductItemFilterDrawer'

// Row actions, action-column tooltip and row link shared between the standalone
// product-item-filters list and the product-item-details preview (Task 11) so the
// two can't drift. The delete action passes no callback: the dialog evicts the
// filter from the cached list, so the row disappears without waiting for a refetch.
export const useProductItemFilterTableActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductItemFilterDrawer } = useProductItemFilterDrawer()
  const { openDeleteProductItemFilterDialog } = useDeleteProductItemFilterDialog()

  const canUpdateProductItemFilters = hasPermissions(['productItemFiltersUpdate'])
  const canDeleteProductItemFilters = hasPermissions(['productItemFiltersDelete'])

  const actionColumnTooltip = useCallback((): string => {
    const label = [
      canUpdateProductItemFilters && translate('text_629728388c4d2300e2d3816a').toLowerCase(),
      canDeleteProductItemFilters && translate('text_629728388c4d2300e2d38182').toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    // uppercase first letter
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [canUpdateProductItemFilters, canDeleteProductItemFilters, translate])

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      generatePath(PRODUCT_ITEM_FILTER_DETAILS_ROUTE, {
        productItemFilterId: id,
        tab: ProductItemFilterDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const actionColumn: ActionColumn<ProductItemFilterForListFragment> = (productItemFilter) => {
    const actions: ActionItem<ProductItemFilterForListFragment>[] = []

    if (canUpdateProductItemFilters) {
      actions.push({
        startIcon: 'pen',
        title: translate('text_629728388c4d2300e2d3816a'),
        onAction: () => openProductItemFilterDrawer({ productItemFilter }),
      })
    }

    if (canDeleteProductItemFilters) {
      actions.push({
        startIcon: 'trash',
        title: translate('text_629728388c4d2300e2d38182'),
        onAction: () => openDeleteProductItemFilterDialog({ productItemFilter }),
      })
    }

    return actions
  }

  return {
    actionColumn,
    actionColumnTooltip,
    getRowActionLink,
    openDeleteProductItemFilterDialog,
  }
}
