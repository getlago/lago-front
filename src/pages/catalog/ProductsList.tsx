import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import {
  Filters,
  formatFiltersForProductsQuery,
  ProductAvailableFilters,
} from '~/components/Filters'
import { SearchInput } from '~/components/SearchInput'
import { PRODUCT_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ProductForDeleteProductDialogFragmentDoc,
  ProductForDrawerFragmentDoc,
  useProductsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductDrawer } from './drawers/product/useProductDrawer'
import { useProductTableActions } from './useProductTableActions'
import { useProductTableColumns } from './useProductTableColumns'

gql`
  fragment ProductForList on Product {
    id
    name
    code
    invoiceDisplayName
    productType
    filtersCount
    createdAt
    productCategory {
      id
      name
      code
    }
    ...ProductForDrawer
    ...ProductForDeleteProductDialog
  }

  query products(
    $page: Int
    $limit: Int
    $searchTerm: String
    $productCategoryIds: [ID!]
    $productType: ProductTypeEnum
    $withoutProductCategory: Boolean
  ) {
    products(
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      productCategoryIds: $productCategoryIds
      productType: $productType
      withoutProductCategory: $withoutProductCategory
    ) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...ProductForList
      }
    }
  }

  ${ProductForDrawerFragmentDoc}
  ${ProductForDeleteProductDialogFragmentDoc}
`

const ProductsList = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductDrawer } = useProductDrawer()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useProductTableActions()
  const [searchParams] = useSearchParams()
  const { page, goToPage } = usePageSearchParam()

  const filtersForProductsQuery = useMemo(
    () => formatFiltersForProductsQuery(searchParams),
    [searchParams],
  )

  // network-only: tabs are route-based so this component remounts on tab switch
  // and `?page` is dropped; a cache-first read would flash the previously viewed
  // page before the page-1 refetch.
  const [getProducts, { data, error, loading, variables }] = useProductsLazyQuery({
    variables: { limit: DEFAULT_PAGE_SIZE, page, ...filtersForProductsQuery },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProducts, loading)

  const canCreateProducts = hasPermissions(['productsCreate'])

  const searchInputOnChange = useCallback(
    (value: string) => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const columns = useProductTableColumns({ withAttachedProductCategory: true })

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
          ...(canCreateProducts && {
            buttonTitle: translate('text_1783622030703m9jlurg4jsn'),
            buttonVariant: 'primary',
            buttonAction: () => openProductDrawer(),
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
        filtersNamePrefix={PRODUCT_LIST_FILTER_PREFIX}
        availableFilters={ProductAvailableFilters}
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
        metadata={data?.products?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="product-items-list"
          data={data?.products?.collection ?? []}
          containerSize={4}
          containerClassName={tw('border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(product) => `${product.name}`}
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

export default ProductsList
