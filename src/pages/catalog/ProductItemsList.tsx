import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { useCallback, useMemo } from 'react'
import { generatePath, useSearchParams } from 'react-router-dom'

import {
  Filters,
  formatFiltersForProductItemsQuery,
  ProductItemAvailableFilters,
} from '~/components/designSystem/Filters'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { ActionColumn, ActionItem } from '~/components/designSystem/Table/types'
import { SearchInput } from '~/components/SearchInput'
import { PRODUCT_ITEM_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { ProductItemDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { PRODUCT_ITEM_DETAILS_ROUTE } from '~/core/router'
import {
  ProductItemForDeleteProductItemDialogFragmentDoc,
  ProductItemForDrawerFragmentDoc,
  ProductItemForListFragment,
  useProductItemsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useDeleteProductItemDialog } from './dialogs/useDeleteProductItemDialog'
import { useProductItemDrawer } from './drawers/productItem/useProductItemDrawer'
import { useProductItemTableColumns } from './useProductItemTableColumns'

gql`
  fragment ProductItemForList on ProductItem {
    id
    name
    code
    invoiceDisplayName
    itemType
    filtersCount
    createdAt
    product {
      id
      name
      code
    }
    ...ProductItemForDrawer
    ...ProductItemForDeleteProductItemDialog
  }

  query productItems(
    $page: Int
    $limit: Int
    $searchTerm: String
    $productIds: [ID!]
    $itemType: ProductItemTypeEnum
    $withoutProduct: Boolean
  ) {
    productItems(
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      productIds: $productIds
      itemType: $itemType
      withoutProduct: $withoutProduct
    ) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...ProductItemForList
      }
    }
  }

  ${ProductItemForDrawerFragmentDoc}
  ${ProductItemForDeleteProductItemDialogFragmentDoc}
`

const ProductItemsList = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductItemDrawer } = useProductItemDrawer()
  const { openDeleteProductItemDialog } = useDeleteProductItemDialog()
  const [searchParams] = useSearchParams()
  const { page, goToPage } = usePageSearchParam()

  const filtersForProductItemsQuery = useMemo(
    () => formatFiltersForProductItemsQuery(searchParams),
    [searchParams],
  )

  // network-only: tabs are route-based so this component remounts on tab switch
  // and `?page` is dropped; a cache-first read would flash the previously viewed
  // page before the page-1 refetch.
  const [getProductItems, { data, error, loading, variables }] = useProductItemsLazyQuery({
    variables: { limit: DEFAULT_PAGE_SIZE, page, ...filtersForProductItemsQuery },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProductItems, loading)

  const canCreateProductItems = hasPermissions(['productItemsCreate'])
  const canUpdateProductItems = hasPermissions(['productItemsUpdate'])
  const canDeleteProductItems = hasPermissions(['productItemsDelete'])

  const composeTooltipLabel = useCallback((): string => {
    const editLabel = translate('text_629728388c4d2300e2d3816a')
    const deleteLabel = translate('text_629728388c4d2300e2d38182')

    let tooltipLabel = [
      canUpdateProductItems && editLabel.toLowerCase(),
      canDeleteProductItems && deleteLabel.toLowerCase(),
    ]
      .filter(Boolean)
      .join(', ')

    // uppercase first letter
    tooltipLabel = tooltipLabel.charAt(0).toUpperCase() + tooltipLabel.slice(1)

    return tooltipLabel
  }, [canUpdateProductItems, canDeleteProductItems, translate])

  const searchInputOnChange = useCallback(
    (value: string) => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

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
        // No callback: the dialog evicts the item from the cached list, so the
        // row disappears without waiting for a refetch.
        onAction: () => openDeleteProductItemDialog({ productItem }),
      })
    }

    return actions
  }

  const columns = useProductItemTableColumns({ withAttachedProduct: true })

  const placeholder: TablePlaceholder = {
    errorState: variables?.searchTerm
      ? {
          title: translate('text_623b53fea66c76017eaebb6e'),
          subtitle: translate('text_63bab307a61c62af497e0599'),
        }
      : {
          title: translate('text_629728388c4d2300e2d380d5'),
          subtitle: translate('text_629728388c4d2300e2d380eb'),
          buttonTitle: translate('text_629728388c4d2300e2d38110'),
          buttonVariant: 'primary',
          buttonAction: () => location.reload(),
        },
    emptyState: variables?.searchTerm
      ? {
          title: translate('text_1783980718114wya9wp01m5i'),
          subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
        }
      : {
          title: translate('text_1783980718114bqx4jce32fv'),
          subtitle: translate('text_1783980718114kj0fch41rw4'),
          ...(canCreateProductItems && {
            buttonTitle: translate('text_1783622030703m9jlurg4jsn'),
            buttonVariant: 'primary',
            buttonAction: () => openProductItemDrawer(),
          }),
        },
  }

  // Inset layout (per design, same as the customer subscriptions tab): the
  // wrapper owns the page gutter so the row dividers and the pager border stop
  // at it instead of running edge to edge; the table keeps only the minimal
  // 4px cell gutter.
  return (
    <div className="px-4 md:px-12">
      <Filters.Provider
        filtersNamePrefix={PRODUCT_ITEM_LIST_FILTER_PREFIX}
        availableFilters={ProductItemAvailableFilters}
      >
        <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
          <SearchInput
            onChange={searchInputOnChange}
            placeholder={translate('text_1783980718114714izppxdwq')}
            data-test="product-items-search-input"
          />
          <Filters.Component />
        </div>
      </Filters.Provider>
      <PaginatedContent
        metadata={data?.productItems?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="product-items-list"
          data={data?.productItems?.collection ?? []}
          containerSize={4}
          containerClassName={tw('border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(productItem) => `${productItem.name}`}
          onRowActionLink={getRowActionLink}
          actionColumnTooltip={composeTooltipLabel}
          actionColumn={actionColumn}
          columns={columns}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </div>
  )
}

export default ProductItemsList
