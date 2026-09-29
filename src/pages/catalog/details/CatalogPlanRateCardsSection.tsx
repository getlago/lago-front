import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { PageSectionTitle } from '~/components/layouts/Section'
import { AppliedRateCardsTable } from '~/components/rateCards/AppliedRateCardsTable'
import { useAppliedRateCardRowActions } from '~/components/rateCards/useAppliedRateCardRowActions'
import { SearchInput } from '~/components/SearchInput'
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
  ) {
    planAppliedRateCards(planId: $planId, page: $page, limit: $limit, searchTerm: $searchTerm) {
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
  const { page, goToPage } = usePageSearchParam()

  // network-only: the section remounts on every tab switch, so a cache-first read would
  // flash the previously viewed page.
  const [getPlanAppliedRateCards, { data, error, loading, variables, refetch }] =
    useGetPlanAppliedRateCardsForRateCardsSectionLazyQuery({
      variables: { planId: catalogPlanId, page, limit: DEFAULT_PAGE_SIZE },
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
    hasSearchTerm: !!variables?.searchTerm,
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
          onClick: () => undefined,
        }}
      />

      <SearchInput
        onChange={searchInputOnChange}
        placeholder={translate('text_17849293094725tv045xhkxf')}
        data-test="catalog-plan-rate-cards-search-input"
      />

      <AppliedRateCardsTable
        rows={rows}
        metadata={data?.planAppliedRateCards?.metadata}
        loading={isLoading}
        hasError={!!error}
        placeholder={placeholder}
        removal={removal}
        onPageChange={goToPage}
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
