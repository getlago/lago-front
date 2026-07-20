import { gql } from '@apollo/client'
import { tw } from 'lago-design-system'
import { useCallback } from 'react'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Table, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  ProductItemFilterForDeleteProductItemFilterDialogFragmentDoc,
  ProductItemFilterForDrawerFragmentDoc,
  useProductItemFiltersLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useProductItemFilterDrawer } from './drawers/productItemFilter/useProductItemFilterDrawer'
import { useProductItemFilterTableActions } from './useProductItemFilterTableActions'
import { useProductItemFilterTableColumns } from './useProductItemFilterTableColumns'

gql`
  fragment ProductItemFilterForList on ProductItemFilter {
    id
    name
    code
    invoiceDisplayName
    createdAt
    attachedToPlanOrSubscription
    productItem {
      id
      name
      invoiceDisplayName
    }
    ...ProductItemFilterForDrawer
    ...ProductItemFilterForDeleteProductItemFilterDialog
  }

  query productItemFilters($page: Int, $limit: Int, $searchTerm: String, $productItemId: ID) {
    productItemFilters(
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      productItemId: $productItemId
    ) {
      collection {
        id
        ...ProductItemFilterForList
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${ProductItemFilterForDrawerFragmentDoc}
  ${ProductItemFilterForDeleteProductItemFilterDialogFragmentDoc}
`

export const PRODUCT_ITEM_FILTERS_LIST_TEST_ID = 'product-item-filters-list'

const ProductItemFiltersList = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openProductItemFilterDrawer } = useProductItemFilterDrawer()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useProductItemFilterTableActions()
  const { page, goToPage } = usePageSearchParam()

  // network-only: tabs are route-based so this component remounts on tab switch
  // and `?page` is dropped; a cache-first read would flash the previously viewed
  // page before the page-1 refetch.
  const [getProductItemFilters, { data, error, loading, variables }] =
    useProductItemFiltersLazyQuery({
      variables: { limit: DEFAULT_PAGE_SIZE, page },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getProductItemFilters, loading)

  const canCreateProductItemFilters = hasPermissions(['productItemFiltersCreate'])

  const searchInputOnChange = useCallback(
    (value: string) => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const { columns } = useProductItemFilterTableColumns({ withAttachedProductItem: true })

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
          ...(canCreateProductItemFilters && {
            buttonTitle: translate('text_17836220307039rf790f045t'),
            buttonVariant: 'primary',
            buttonAction: () => openProductItemFilterDrawer(),
          }),
        },
  }

  // Inset layout (per design, same as the customer subscriptions tab): the
  // wrapper owns the page gutter so the row dividers and the pager border stop
  // at it instead of running edge to edge; the table keeps only the minimal
  // 4px cell gutter.
  return (
    <div className="px-4 md:px-12" data-test={PRODUCT_ITEM_FILTERS_LIST_TEST_ID}>
      <div className="py-4">
        <SearchInput
          onChange={searchInputOnChange}
          placeholder={translate('text_17845854002450t175dwblcq')}
          data-test="product-item-filters-search-input"
        />
      </div>
      <PaginatedContent
        metadata={data?.productItemFilters?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="product-item-filters-list"
          data={data?.productItemFilters?.collection ?? []}
          containerSize={4}
          containerClassName={tw('border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          rowDataTestId={(productItemFilter) => `${productItemFilter.name}`}
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

export default ProductItemFiltersList
