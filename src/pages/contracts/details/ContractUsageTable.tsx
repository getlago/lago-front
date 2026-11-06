import { gql } from '@apollo/client'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { PaginatedContent } from '~/components/designSystem/Pagination/PaginatedContent'
import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import {
  ContractUsageAvailableFilters,
  Filters,
  formatFiltersForContractUsagesQuery,
} from '~/components/Filters'
import { SearchInput } from '~/components/SearchInput'
import { CONTRACT_USAGE_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  GetContractUsagesQuery,
  useGetContractUsagesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

gql`
  query getContractUsages(
    $contractId: ID!
    $page: Int
    $limit: Int
    $searchTerm: String
    $productCategoryIds: [ID!]
    $withoutProductCategory: Boolean
    $productIds: [ID!]
    $productFilterIds: [ID!]
    $withoutProductFilter: Boolean
    $productType: ProductTypeEnum
  ) {
    contractUsages(
      contractId: $contractId
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      productCategoryIds: $productCategoryIds
      withoutProductCategory: $withoutProductCategory
      productIds: $productIds
      productFilterIds: $productFilterIds
      withoutProductFilter: $withoutProductFilter
      productType: $productType
    ) {
      collection {
        id: rateCardCode
        invoiceDisplayName
        units
        amountCents
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

type ContractUsageRow = GetContractUsagesQuery['contractUsages']['collection'][number]

type ContractUsageTableProps = {
  contractId: string
  currency?: CurrencyEnum
  onErrorChange?: (hasError: boolean) => void
}

export const ContractUsageTable = ({
  contractId,
  currency,
  onErrorChange,
}: ContractUsageTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { page, goToPage } = usePageSearchParam(CONTRACT_USAGE_LIST_FILTER_PREFIX)
  const [searchParams] = useSearchParams()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const categoryId = searchParams.get('categoryId')
  const filtersForQuery = useMemo(
    () => formatFiltersForContractUsagesQuery(searchParams),
    [searchParams],
  )

  // network-only: this table can remount when the tab's error placeholder recovers (see
  // ContractUsageSection), so a cache-first read would flash a previous page's data.
  const [getContractUsages, { data, error, loading, variables }] = useGetContractUsagesLazyQuery({
    variables: {
      contractId,
      page,
      limit: pageSize,
      productCategoryIds: categoryId ? [categoryId] : undefined,
      withoutProductCategory: !categoryId,
      ...filtersForQuery,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getContractUsages, loading)

  useEffect(() => {
    onErrorChange?.(!!error)
  }, [error, onErrorChange])

  const searchInputOnChange = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  const rows = data?.contractUsages?.collection ?? []

  const placeholder = buildSearchAwareTablePlaceholder({
    translate,
    hasSearchTerm: !!variables?.searchTerm || Object.keys(filtersForQuery).length > 0,
    noResultTitleKey: 'text_179397025742335pofdjfjec',
    emptyTitleKey: 'text_62c3f454e5d7f4ec8888c1d5',
    emptySubtitleKey: 'text_1793970257423on7ni7z0q0a',
  })

  const columns: Array<TableColumn<ContractUsageRow>> = [
    {
      key: 'invoiceDisplayName',
      title: translate('text_1793970414838gfp6mgqj7pz'),
      minWidth: 240,
      maxSpace: true,
      content: (row) => row.invoiceDisplayName,
    },
    {
      key: 'units',
      title: translate('text_17939704148386zuqpffeq6b'),
      textAlign: 'right',
      minWidth: 88,
      content: (row) => row.units,
    },
    {
      key: 'amountCents',
      title: translate('text_1793970414838aflgomdduie'),
      textAlign: 'right',
      minWidth: 112,
      content: (row) =>
        intlFormatNumber(deserializeAmount(row.amountCents, currency ?? CurrencyEnum.Usd) ?? 0, {
          currencyDisplay: 'symbol',
          currency,
        }),
    },
  ]

  return (
    <div className="flex w-full flex-col gap-3">
      <Filters.Provider
        filtersNamePrefix={CONTRACT_USAGE_LIST_FILTER_PREFIX}
        availableFilters={ContractUsageAvailableFilters}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            onChange={searchInputOnChange}
            placeholder={translate('text_1793970437922isq99n60xde')}
          />
          <Filters.Component />
        </div>
      </Filters.Provider>

      <PaginatedContent
        metadata={data?.contractUsages?.metadata}
        loading={isLoading}
        onPageChange={goToPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size)
          goToPage(1)
        }}
      >
        <Table
          name="contract-usages"
          data={rows}
          columns={columns}
          isLoading={isLoading}
          loadingRowCount={pageSize}
          hasError={!!error}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </div>
  )
}
