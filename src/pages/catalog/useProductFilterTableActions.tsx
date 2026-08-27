import { useCallback } from 'react'
import { generatePath } from 'react-router-dom'

import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { ProductFilterDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_FILTER_DETAILS_ROUTE } from '~/core/router'
import { ProductFilterForListFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteProductFilterDialog } from './dialogs/useDeleteProductFilterDialog'
import { useProductFilterDrawer } from './drawers/productFilter/useProductFilterDrawer'

// Row actions, action-column tooltip and row link shared between the standalone
// product-item-filters list and the product-item-details preview (Task 11) so the
// two can't drift. The delete action passes no callback: the dialog evicts the
// filter from the cached list, so the row disappears without waiting for a refetch.
export const useProductFilterTableActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductFilterDrawer } = useProductFilterDrawer()
  const { openDeleteProductFilterDialog } = useDeleteProductFilterDialog()

  const canUpdateProductFilters = hasPermissions(['productFiltersUpdate'])
  const canDeleteProductFilters = hasPermissions(['productFiltersDelete'])

  const actionColumnTooltip = useCallback((): string => {
    const label = [
      canUpdateProductFilters && translate('text_629728388c4d2300e2d3816a').toLowerCase(),
      canDeleteProductFilters && translate('text_629728388c4d2300e2d38182').toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    // uppercase first letter
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [canUpdateProductFilters, canDeleteProductFilters, translate])

  const getRowActionLink = useCallback(
    ({ id }: { id: string }) =>
      generatePath(PRODUCT_FILTER_DETAILS_ROUTE, {
        productFilterId: id,
        tab: ProductFilterDetailsTabsOptionsEnum.overview,
      }),
    [],
  )

  const actionColumn: ActionColumn<ProductFilterForListFragment> = (productFilter) => {
    const actions: ActionItem<ProductFilterForListFragment>[] = []

    if (canUpdateProductFilters) {
      actions.push({
        startIcon: 'pen',
        title: translate('text_629728388c4d2300e2d3816a'),
        onAction: () => openProductFilterDrawer({ productFilter }),
      })
    }

    if (canDeleteProductFilters) {
      actions.push({
        startIcon: 'trash',
        title: translate('text_629728388c4d2300e2d38182'),
        onAction: () => openDeleteProductFilterDialog({ productFilter }),
      })
    }

    return actions
  }

  return {
    actionColumn,
    actionColumnTooltip,
    getRowActionLink,
    openDeleteProductFilterDialog,
  }
}
