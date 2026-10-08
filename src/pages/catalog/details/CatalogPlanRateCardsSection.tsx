import { gql } from '@apollo/client'
import { useMemo, useState } from 'react'
import { generatePath, useSearchParams } from 'react-router'

import { AppliedRateCardsTable } from '~/components/appliedRateCards/AppliedRateCardsTable'
import { useAppliedRateCardDrawer } from '~/components/appliedRateCards/drawers/appliedRateCard/useAppliedRateCardDrawer'
import { useAppliedRateCardRowActions } from '~/components/appliedRateCards/useAppliedRateCardRowActions'
import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import {
  AppliedRateCardsAvailableFilters,
  Filters,
  formatFiltersForAppliedRateCardsQuery,
} from '~/components/Filters'
import { PageSectionTitle } from '~/components/layouts/Section'
import { SearchInput } from '~/components/SearchInput'
import { APPLIED_RATE_CARD_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE } from '~/core/router'
import {
  PlanAppliedRateCardForAppliedRateCardsTableFragmentDoc,
  useGetPlanAppliedRateCardsForRateCardsSectionLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

export const CATALOG_PLAN_ADD_RATE_CARD_TEST_ID = 'catalog-plan-add-rate-card'

gql`
  query getPlanAppliedRateCardsForRateCardsSection(
    $planId: ID!
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
    planAppliedRateCards(
      planId: $planId
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
        ...PlanAppliedRateCardForAppliedRateCardsTable
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${PlanAppliedRateCardForAppliedRateCardsTableFragmentDoc}
`

type CatalogPlanRateCardsSectionProps = {
  catalogPlanId: string
  isRemovalLocked: boolean
}

export const CatalogPlanRateCardsSection = ({
  catalogPlanId,
  isRemovalLocked,
}: CatalogPlanRateCardsSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { openDrawer: openAppliedRateCardDrawer } = useAppliedRateCardDrawer()
  const { page, goToPage } = usePageSearchParam()
  const [searchParams] = useSearchParams()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const filtersForQuery = useMemo(
    () => formatFiltersForAppliedRateCardsQuery(searchParams),
    [searchParams],
  )

  // network-only: the section remounts on every tab switch, so a cache-first read would
  // flash the previously viewed page.
  const [getPlanAppliedRateCards, { data, error, loading, variables, refetch }] =
    useGetPlanAppliedRateCardsForRateCardsSectionLazyQuery({
      variables: { planId: catalogPlanId, page, limit: pageSize, ...filtersForQuery },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getPlanAppliedRateCards, loading)

  const { removal, copyRateCardCode, removeRateCard } = useAppliedRateCardRowActions({
    context: 'plan',
    parentId: catalogPlanId,
    isRemovalLocked,
    onRemoved: () => refetch(),
  })

  const searchInputOnChange = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  const rows = data?.planAppliedRateCards?.collection ?? []

  const placeholder = buildSearchAwareTablePlaceholder({
    translate,
    hasSearchTerm: !!variables?.searchTerm || Object.keys(filtersForQuery).length > 0,
    noResultTitleKey: 'text_17849293094732goytgdvyql',
    emptyTitleKey: 'text_1789030049529u2gzzho6x8x',
    emptySubtitleKey: 'text_17891323549937b5qwry7pn1',
  })

  return (
    <section className="flex flex-col gap-6">
      <PageSectionTitle
        title={translate('text_1783104239825nxqno33u945')}
        subtitle={translate('text_1789030049529jp760bke0x8')}
        action={{
          title: translate('text_1789030049529b0zmy1slfxl'),
          dataTest: CATALOG_PLAN_ADD_RATE_CARD_TEST_ID,
          onClick: () => openAppliedRateCardDrawer({ context: 'plan', planId: catalogPlanId }),
        }}
      />

      <Filters.Provider
        filtersNamePrefix={APPLIED_RATE_CARD_LIST_FILTER_PREFIX}
        availableFilters={AppliedRateCardsAvailableFilters}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            onChange={searchInputOnChange}
            placeholder={translate('text_17849293094725tv045xhkxf')}
            data-test="catalog-plan-rate-cards-search-input"
          />
          <Filters.Component />
        </div>
      </Filters.Provider>

      <AppliedRateCardsTable
        rows={rows}
        metadata={data?.planAppliedRateCards?.metadata}
        loading={isLoading}
        hasError={!!error}
        placeholder={placeholder}
        removal={removal}
        onPageChange={goToPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size)
          goToPage(1)
        }}
        getRateCardHref={(row) =>
          generatePath(CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE, {
            catalogPlanId,
            appliedRateCardId: row.id,
          })
        }
        onCopyRateCardCode={copyRateCardCode}
        onRemoveRateCard={removeRateCard}
      />
    </section>
  )
}
