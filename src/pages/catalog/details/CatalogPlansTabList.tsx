import { gql } from '@apollo/client'
import { useCallback, useState } from 'react'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { Table } from '~/components/designSystem/Table/Table'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  CatalogPlanForCatalogPlanDrawerFragmentDoc,
  CatalogPlanForDeleteCatalogPlanDialogFragmentDoc,
  useGetCatalogPlansForCatalogObjectDetailsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

import { useCatalogPlanTableActions } from '../useCatalogPlanTableActions'
import { useCatalogPlanTableColumns } from '../useCatalogPlanTableColumns'

export const CATALOG_PLANS_TAB_LIST_SEARCH_TEST_ID = 'catalog-plans-tab-list-search-input'

gql`
  fragment CatalogPlanForCatalogPlansTabList on CatalogPlan {
    id
    name
    code
    invoiceDisplayName
    createdAt
    appliedRateCardsCount
    contractsCount
    ...CatalogPlanForCatalogPlanDrawer
    ...CatalogPlanForDeleteCatalogPlanDialog
  }

  query getCatalogPlansForCatalogObjectDetails(
    $productIds: [ID!]
    $productFilterIds: [ID!]
    $productCategoryIds: [ID!]
    $rateCardIds: [ID!]
    $page: Int
    $limit: Int
    $searchTerm: String
  ) {
    catalogPlans(
      productIds: $productIds
      productFilterIds: $productFilterIds
      productCategoryIds: $productCategoryIds
      rateCardIds: $rateCardIds
      page: $page
      limit: $limit
      searchTerm: $searchTerm
    ) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...CatalogPlanForCatalogPlansTabList
      }
    }
  }

  ${CatalogPlanForCatalogPlanDrawerFragmentDoc}
  ${CatalogPlanForDeleteCatalogPlanDialogFragmentDoc}
`

export type CatalogPlansTabListScope =
  | { productId: string }
  | { productFilterId: string }
  | { productCategoryId: string }
  | { rateCardId: string }

const scopeToVariables = (
  scope: CatalogPlansTabListScope,
): {
  productIds?: string[]
  productFilterIds?: string[]
  productCategoryIds?: string[]
  rateCardIds?: string[]
} => {
  if ('productId' in scope) return { productIds: [scope.productId] }
  if ('productFilterId' in scope) return { productFilterIds: [scope.productFilterId] }
  if ('productCategoryId' in scope) return { productCategoryIds: [scope.productCategoryId] }

  return { rateCardIds: [scope.rateCardId] }
}

// One full sentence per object type rather than a single interpolated string: the
// article agrees with the noun's gender in some locales (French "ce" vs "cette"),
// which string-splicing would break.
const scopeToEmptyTitleKey = (scope: CatalogPlansTabListScope): string => {
  if ('productId' in scope) return 'text_1791463004449lwoqb88e5zb'
  if ('productFilterId' in scope) return 'text_1791463004449xeg7s65pg1h'
  if ('productCategoryId' in scope) return 'text_1791463004449t63ke0nsc2y'

  return 'text_17914630044498glf9v0i00u'
}

const CatalogPlansTabList = ({ scope }: { scope: CatalogPlansTabListScope }): JSX.Element => {
  const { translate } = useInternationalization()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useCatalogPlanTableActions()
  const columns = useCatalogPlanTableColumns()
  const { page, goToPage } = usePageSearchParam()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [getCatalogPlans, { data, error, loading, variables }] =
    useGetCatalogPlansForCatalogObjectDetailsLazyQuery({
      variables: { ...scopeToVariables(scope), limit: pageSize, page },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getCatalogPlans, loading)

  const searchInputOnChange = useCallback(
    (value: string): void => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const placeholder = buildSearchAwareTablePlaceholder({
    translate,
    hasSearchTerm: !!variables?.searchTerm,
    noResultTitleKey: 'text_1789030049528z655xwavs78',
    emptyTitleKey: scopeToEmptyTitleKey(scope),
    emptySubtitleKey: 'text_17890300495297g290y7et77',
  })

  return (
    <div className="flex flex-1 flex-col">
      <SearchInput
        className="mb-4"
        onChange={searchInputOnChange}
        placeholder={translate('text_1789030049528lqtvvif9k1p')}
        data-test={CATALOG_PLANS_TAB_LIST_SEARCH_TEST_ID}
      />

      <PaginatedContent
        metadata={data?.catalogPlans?.metadata}
        loading={isLoading}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          goToPage(1)
        }}
      >
        <Table
          name="catalog-plans-tab-list"
          data={data?.catalogPlans?.collection ?? []}
          containerSize={0}
          containerClassName="-mb-px h-auto shrink-0 border-t border-grey-300"
          rowSize={72}
          isLoading={isLoading}
          loadingRowCount={pageSize}
          hasError={!!error}
          rowDataTestId={(catalogPlan) => `${catalogPlan.name}`}
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

export default CatalogPlansTabList
