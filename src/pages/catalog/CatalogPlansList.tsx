import { gql } from '@apollo/client'
import { useCallback, useState } from 'react'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { Table } from '~/components/designSystem/Table/Table'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  CatalogPlanForCatalogPlanDrawerFragmentDoc,
  CatalogPlanForDeleteCatalogPlanDialogFragmentDoc,
  CatalogPlanForTableColumnsFragmentDoc,
  useCatalogPlansLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

import { useCatalogPlanDrawer } from './drawers/catalogPlan/useCatalogPlanDrawer'
import { useCatalogPlanTableActions } from './useCatalogPlanTableActions'
import { useCatalogPlanTableColumns } from './useCatalogPlanTableColumns'

export const CATALOG_PLANS_LIST_SEARCH_TEST_ID = 'catalog-plans-search-input'
export const CATALOG_PLANS_CREATE_TEST_ID = 'create-catalog-plan-cta'

gql`
  fragment CatalogPlanForList on CatalogPlan {
    id
    ...CatalogPlanForTableColumns
    ...CatalogPlanForCatalogPlanDrawer
    ...CatalogPlanForDeleteCatalogPlanDialog
  }

  query catalogPlans($page: Int, $limit: Int, $searchTerm: String) {
    catalogPlans(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...CatalogPlanForList
      }
    }
  }

  ${CatalogPlanForTableColumnsFragmentDoc}
  ${CatalogPlanForCatalogPlanDrawerFragmentDoc}
  ${CatalogPlanForDeleteCatalogPlanDialogFragmentDoc}
`

const CatalogPlansList = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openCatalogPlanDrawer } = useCatalogPlanDrawer()
  const { actionColumn, actionColumnTooltip, getRowActionLink } = useCatalogPlanTableActions()
  const columns = useCatalogPlanTableColumns()
  const { page, goToPage } = usePageSearchParam()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [getCatalogPlans, { data, error, loading, variables }] = useCatalogPlansLazyQuery({
    variables: { limit: pageSize, page },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getCatalogPlans, loading)

  const canCreateCatalogPlans = hasPermissions(['plansCreate'])

  const searchInputOnChange = useCallback(
    (value: string): void => {
      goToPage(1)
      debouncedSearch?.(value)
    },
    [goToPage, debouncedSearch],
  )

  const actions: MainHeaderAction[] = [
    {
      type: 'action',
      label: translate('text_1789030049528b0qu0hphtg4'),
      variant: 'primary',
      hidden: !canCreateCatalogPlans,
      onClick: () => openCatalogPlanDrawer(),
      dataTest: CATALOG_PLANS_CREATE_TEST_ID,
    },
  ]

  const placeholder = buildSearchAwareTablePlaceholder({
    translate,
    hasSearchTerm: !!variables?.searchTerm,
    noResultTitleKey: 'text_1789030049528z655xwavs78',
    emptyTitleKey: 'text_17890300495285vbd2xto1kc',
    emptySubtitleKey: 'text_17890300495297g290y7et77',
    emptyAction: canCreateCatalogPlans
      ? {
          buttonTitleKey: 'text_1789030049528b0qu0hphtg4',
          onClick: () => openCatalogPlanDrawer(),
        }
      : undefined,
  })

  return (
    <div className="flex flex-1 flex-col px-4 md:px-12">
      <MainHeader.Configure
        entity={{ viewName: translate('text_62442e40cea25600b0b6d85a') }}
        actions={{ items: actions }}
        filtersSection={
          <SearchInput
            onChange={searchInputOnChange}
            placeholder={translate('text_1789030049528lqtvvif9k1p')}
            data-test={CATALOG_PLANS_LIST_SEARCH_TEST_ID}
          />
        }
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
          name="catalog-plans-list"
          data={data?.catalogPlans?.collection ?? []}
          containerSize={4}
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

export default CatalogPlansList
