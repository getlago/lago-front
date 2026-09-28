import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { generatePath, useSearchParams } from 'react-router'

import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import {
  AppliedRateCardsAvailableFilters,
  Filters,
  formatFiltersForAppliedRateCardsQuery,
} from '~/components/Filters'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { AppliedRateCardsTable } from '~/components/rateCards/AppliedRateCardsTable'
import { useAppliedRateCardRowActions } from '~/components/rateCards/useAppliedRateCardRowActions'
import { SearchInput } from '~/components/SearchInput'
import { APPLIED_RATE_CARD_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CONTRACT_RATE_CARD_DETAILS_ROUTE } from '~/core/router'
import {
  ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  useGetContractAppliedRateCardsForRateCardsSectionLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

gql`
  query getContractAppliedRateCardsForRateCardsSection(
    $contractId: ID!
    $page: Int
    $limit: Int
    $searchTerm: String
    $productCategoryIds: [ID!]
    $productIds: [ID!]
    $productFilterIds: [ID!]
    $productType: ProductTypeEnum
    $hasRateOverrides: Boolean
    $withoutProductCategory: Boolean
    $withoutProductFilter: Boolean
  ) {
    contractAppliedRateCards(
      contractId: $contractId
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      productCategoryIds: $productCategoryIds
      productIds: $productIds
      productFilterIds: $productFilterIds
      productType: $productType
      hasRateOverrides: $hasRateOverrides
      withoutProductCategory: $withoutProductCategory
      withoutProductFilter: $withoutProductFilter
    ) {
      collection {
        id
        ...ContractAppliedRateCardForAppliedRateCardsTable
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${ContractAppliedRateCardForAppliedRateCardsTableFragmentDoc}
`

type ContractRateCardsSectionProps = {
  contractId: string
  isRemovalLocked: boolean
}

export const ContractRateCardsSection = ({
  contractId,
  isRemovalLocked,
}: ContractRateCardsSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { page, goToPage } = usePageSearchParam()
  const [searchParams] = useSearchParams()

  const filtersForQuery = useMemo(
    () => formatFiltersForAppliedRateCardsQuery(searchParams),
    [searchParams],
  )

  // network-only: the section remounts on every tab switch, so a cache-first read would
  // flash the previously viewed page.
  const [getContractAppliedRateCards, { data, error, loading, variables, refetch }] =
    useGetContractAppliedRateCardsForRateCardsSectionLazyQuery({
      variables: { contractId, page, limit: DEFAULT_PAGE_SIZE, ...filtersForQuery },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getContractAppliedRateCards, loading)

  const { removal, copyRateCardCode, removeRateCard } = useAppliedRateCardRowActions({
    context: 'contract',
    parentId: contractId,
    isRemovalLocked,
    onRemoved: () => refetch(),
  })

  const searchInputOnChange = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  const rows = data?.contractAppliedRateCards?.collection ?? []

  const placeholder = buildSearchAwareTablePlaceholder({
    translate,
    hasSearchTerm: !!variables?.searchTerm || Object.keys(filtersForQuery).length > 0,
    noResultTitleKey: 'text_17849293094732goytgdvyql',
    emptyTitleKey: 'text_1789030049529u2gzzho6x8x',
    emptySubtitleKey: 'text_1789723302114au3ml0nf077',
  })

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={translate('text_1783104239825nxqno33u945')}
        description={translate('text_1789030049529jp760bke0x8')}
        contentClassName="gap-2"
      />

      <Filters.Provider
        filtersNamePrefix={APPLIED_RATE_CARD_LIST_FILTER_PREFIX}
        availableFilters={AppliedRateCardsAvailableFilters}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            onChange={searchInputOnChange}
            placeholder={translate('text_17849293094725tv045xhkxf')}
            data-test="contract-rate-cards-search-input"
          />
          <Filters.Component />
        </div>
      </Filters.Provider>

      <AppliedRateCardsTable
        rows={rows}
        metadata={data?.contractAppliedRateCards?.metadata}
        loading={isLoading}
        hasError={!!error}
        placeholder={placeholder}
        removal={removal}
        onPageChange={goToPage}
        getRateCardHref={(row) =>
          generatePath(CONTRACT_RATE_CARD_DETAILS_ROUTE, {
            id: contractId,
            appliedRateCardId: row.id,
          })
        }
        onCopyRateCardCode={copyRateCardCode}
        onRemoveRateCard={removeRateCard}
      />
    </section>
  )
}
