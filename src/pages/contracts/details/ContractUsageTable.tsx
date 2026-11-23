import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { Chip } from '~/components/designSystem/Chip'
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
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { SearchInput } from '~/components/SearchInput'
import { CONTRACT_USAGE_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { intlFormatDateTime } from '~/core/timezone'
import {
  CurrencyEnum,
  GetContractUsagesQuery,
  TimezoneEnum,
  useGetContractUsagesLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useRefetchOnTokenChange } from '~/hooks/useRefetchOnTokenChange'
import { PRODUCT_ITEM_TYPE_TRANSLATION_KEY } from '~/pages/catalog/useProductTableColumns'

import { ContractUsageFilterOptions } from './useContractUsageCategories'

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
        productType
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

type ContractUsageTableProps = {
  contractId: string
  categoryId: string | null
  currency: CurrencyEnum
  customerTimezone: TimezoneEnum
  refreshToken?: number
  pageSize: number
  onPageSizeChange: (pageSize: number) => void
  filterOptions?: ContractUsageFilterOptions
}

export const ContractUsageTable = ({
  contractId,
  categoryId,
  currency,
  customerTimezone,
  refreshToken,
  pageSize,
  onPageSizeChange,
  filterOptions,
}: ContractUsageTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  // Bare key: must match the rail's own link-building, which drops the bare `page` key on every
  // category switch - a prefixed key here would silently stop matching that.
  const { page, goToPage } = usePageSearchParam()
  const [searchParams] = useSearchParams()

  const filtersForQuery = useMemo(
    () => formatFiltersForContractUsagesQuery(searchParams),
    [searchParams],
  )

  // This table remounts on every tab switch, so a cache-first read would flash the previously
  // viewed page - same reasoning as ContractRateCardsSection's identical override.
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
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getContractUsages, loading)

  useRefetchOnTokenChange(refreshToken, refetch)

  const searchInputOnChange = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  const rows = data?.contractUsages?.collection ?? []
  const optionsByFilter = useMemo(
    () =>
      filterOptions && {
        [AvailableFiltersEnum.rateCardProduct]: filterOptions.products,
        [AvailableFiltersEnum.appliedRateCardProductFilter]: filterOptions.productFilters,
      },
    [filterOptions],
  )

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
              fromDate: intlFormatDateTime(row.fromDatetime, { timezone: customerTimezone }).date,
              toDate: intlFormatDateTime(row.toDatetime, { timezone: customerTimezone }).date,
            })}
          </Typography>
        </div>
      ),
    },
    {
      key: 'productType',
      title: translate('text_6560809c38fb9de88d8a52fb'),
      textAlign: 'right',
      minWidth: 112,
      content: (row) => (
        <Chip label={translate(PRODUCT_ITEM_TYPE_TRANSLATION_KEY[row.productType])} />
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
        intlFormatNumber(deserializeAmount(row.amountCents, currency), {
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
        optionsByFilter={optionsByFilter}
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
          onPageSizeChange(size)
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
          containerSize={0}
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
