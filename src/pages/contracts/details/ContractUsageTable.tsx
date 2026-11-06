import { gql } from '@apollo/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'

import { PaginatedContent } from '~/components/designSystem/Pagination/PaginatedContent'
import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
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
import { intlFormatDateTime } from '~/core/timezone'
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
        productCode
        productName
        productFilterCode
        fromDatetime
        toDatetime
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

export const CONTRACT_USAGE_ROW_NAME_TEST_ID = 'contract-usage-row-name'

// refreshToken: bump to re-fetch in place (not remount) - a remount would also reset this
// table's own local state (search term, page size). See ContractUsageSection.
type ContractUsageTableProps = {
  contractId: string
  currency?: CurrencyEnum
  onErrorChange?: (hasError: boolean) => void
  refreshToken?: number
}

export const ContractUsageTable = ({
  contractId,
  currency,
  onErrorChange,
  refreshToken,
}: ContractUsageTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  // Bare key: must match the rail's own link-building, which drops the bare `page` key on every
  // category switch - a prefixed key here would silently stop matching that.
  const { page, goToPage } = usePageSearchParam()
  const [searchParams] = useSearchParams()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const categoryId = searchParams.get('categoryId')
  const filtersForQuery = useMemo(
    () => formatFiltersForContractUsagesQuery(searchParams),
    [searchParams],
  )

  // No fetchPolicy override: the app default caches a revisited category/page. Refresh still
  // forces fresh data via its own refetch() below, which always hits the network.
  const [getContractUsages, { data, error, loading, variables, refetch }] =
    useGetContractUsagesLazyQuery({
      variables: {
        contractId,
        page,
        limit: pageSize,
        productCategoryIds: categoryId ? [categoryId] : undefined,
        withoutProductCategory: !categoryId,
        ...filtersForQuery,
      },
      notifyOnNetworkStatusChange: true,
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getContractUsages, loading)

  useEffect(() => {
    onErrorChange?.(!!error)
  }, [error, onErrorChange])

  const isFirstRefreshRender = useRef(true)

  useEffect(() => {
    if (isFirstRefreshRender.current) {
      isFirstRefreshRender.current = false
      return
    }
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken])

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
      content: (row) => (
        <div
          data-test={CONTRACT_USAGE_ROW_NAME_TEST_ID}
          data-indented={row.productFilterCode ? 'true' : 'false'}
          className={row.productFilterCode ? 'pl-4' : undefined}
        >
          <Typography variant="bodyHl" color="grey700" noWrap>
            {row.invoiceDisplayName}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_633dae57ca9a923dd53c2097', {
              fromDate: intlFormatDateTime(row.fromDatetime).date,
              toDate: intlFormatDateTime(row.toDatetime).date,
            })}
          </Typography>
        </div>
      ),
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
          rowSize={72}
          isLoading={isLoading}
          loadingRowCount={pageSize}
          hasError={!!error}
          placeholder={placeholder}
          getRowGroupHeader={(row, index, allRows) => {
            const previousRow = index > 0 ? allRows[index - 1] : undefined
            const isFirstOfGroup = previousRow?.productCode !== row.productCode

            if (!isFirstOfGroup || !row.productFilterCode) return undefined

            return (
              <Typography variant="captionHl" color="grey600">
                {row.productName}
              </Typography>
            )
          }}
        />
      </PaginatedContent>
    </div>
  )
}
