import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import {
  Filters,
  formatFiltersForProductFiltersQuery,
  ProductFilterAvailableFilters,
} from '~/components/Filters'
import { SearchInput } from '~/components/SearchInput'
import { PRODUCT_FILTER_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ProductFilterForDeleteProductFilterDialogFragmentDoc,
  ProductFilterForDrawerFragmentDoc,
  useProductFiltersLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductFilterDrawer } from './drawers/productFilter/useProductFilterDrawer'
import { useProductFilterTableActions } from './useProductFilterTableActions'
import { useProductFilterTableColumns } from './useProductFilterTableColumns'

gql`
  fragment ProductFilterForList on ProductFilter {
    id
    name
    code
    invoiceDisplayName
    createdAt
    attachedToPlanOrSubscription
    product {
      id
      name
      invoiceDisplayName
    }
    ...ProductFilterForDrawer
    ...ProductFilterForDeleteProductFilterDialog
  }

  query productFilters($page: Int, $limit: Int, $searchTerm: String, $productId: ID) {
    productFilters(page: $page, limit: $limit, searchTerm: $searchTerm, productId: $productId) {
      collection {
        id
        ...ProductFilterForList
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${ProductFilterForDrawerFragmentDoc}
  ${ProductFilterForDeleteProductFilterDialogFragmentDoc}
`

export const PRODUCT_ITEM_FILTERS_LIST_TEST_ID = 'product-item-filters-list'

const ProductFiltersList = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductFilterDrawer } = useProductFilterDrawer()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useProductFilterTableActions()
  const [searchParams] = useSearchParams()
  const { page, goToPage } = usePageSearchParam()

  const filtersForProductFiltersQuery = useMemo(
    () => formatFiltersForProductFiltersQuery(searchParams),
    [searchParams],
  )

  // network-only: tabs are route-based so this component remounts on tab switch
  // and `?page` is dropped; a cache-first read would flash the previously viewed
  // page before the page-1 refetch.
  const [getProductFilters, { data, error, loading, variables }] = useProductFiltersLazyQuery({
    variables: { limit: DEFAULT_PAGE_SIZE, page, ...filtersForProductFiltersQuery },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProductFilters, loading)

  const canCreateProductFilters = hasPermissions(['productFiltersCreate'])

  const searchInputOnChange = useCallback(
    (value: string) => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const { columns } = useProductFilterTableColumns({ withAttachedProduct: true })

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
          title: translate('text_1784585400245cbvbv7nqwi8'),
          subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
        }
      : {
          title: translate('text_1784585400245a6ghyeaz5wf'),
          subtitle: translate('text_1784585400245nj226z9y9tp'),
          ...(canCreateProductFilters && {
            buttonTitle: translate('text_17836220307039rf790f045t'),
            buttonVariant: 'primary',
            buttonAction: () => openProductFilterDrawer(),
          }),
        },
  }

  // Inset layout (per design, same as the customer subscriptions tab): the
  // wrapper owns the page gutter so the row dividers and the pager border stop
  // at it instead of running edge to edge; the table keeps only the minimal
  // 4px cell gutter.
  return (
    <div className="px-4 md:px-12" data-test={PRODUCT_ITEM_FILTERS_LIST_TEST_ID}>
      <Filters.Provider
        filtersNamePrefix={PRODUCT_FILTER_LIST_FILTER_PREFIX}
        availableFilters={ProductFilterAvailableFilters}
      >
        <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
          <SearchInput
            onChange={searchInputOnChange}
            placeholder={translate('text_17845854002450t175dwblcq')}
            data-test="product-item-filters-search-input"
          />
          <Filters.Component />
        </div>
      </Filters.Provider>
      <PaginatedContent
        metadata={data?.productFilters?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="product-item-filters-list"
          data={data?.productFilters?.collection ?? []}
          containerSize={4}
          containerClassName={tw('border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(productFilter) => `${productFilter.name}`}
          onRowActionLink={getRowActionLink}
          actionColumnTooltip={actionColumnTooltip}
          actionColumn={actionColumn}
          columns={columns}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </div>
  )
}

export default ProductFiltersList
