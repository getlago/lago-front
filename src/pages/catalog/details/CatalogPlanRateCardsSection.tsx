import { gql, useApolloClient } from '@apollo/client'
import { generatePath } from 'react-router'

import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { PageSectionTitle } from '~/components/layouts/Section'
import { AppliedRateCardsTable } from '~/components/rateCards/AppliedRateCardsTable'
import { useRemoveAppliedRateCardDialog } from '~/components/rateCards/dialogs/useRemoveAppliedRateCardDialog'
import { SearchInput } from '~/components/SearchInput'
import { addToast } from '~/core/apolloClient'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useGetPlanAppliedRateCardsForRateCardsSectionLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

export const CATALOG_PLAN_ADD_RATE_CARD_TEST_ID = 'catalog-plan-add-rate-card'

gql`
  fragment PlanAppliedRateCardForRateCardsSection on PlanAppliedRateCard {
    id
    ratePhasesCount
    product {
      id
      name
      invoiceDisplayName
      productCategory {
        id
        name
        invoiceDisplayName
      }
    }
    rateCard {
      id
      name
      code
      productFilter {
        id
        name
        invoiceDisplayName
      }
    }
  }

  query getPlanAppliedRateCardsForRateCardsSection(
    $planId: ID!
    $page: Int
    $limit: Int
    $searchTerm: String
  ) {
    planAppliedRateCards(planId: $planId, page: $page, limit: $limit, searchTerm: $searchTerm) {
      collection {
        ...PlanAppliedRateCardForRateCardsSection
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

type CatalogPlanRateCardsSectionProps = {
  catalogPlanId: string
}

export const CatalogPlanRateCardsSection = ({
  catalogPlanId,
}: CatalogPlanRateCardsSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const client = useApolloClient()
  const { page, goToPage } = usePageSearchParam()
  const { openRemoveAppliedRateCardDialog } = useRemoveAppliedRateCardDialog()

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

  const canRemoveRateCard = hasPermissions(['plansUpdate'])

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
        canRemove={canRemoveRateCard}
        onPageChange={goToPage}
        getRateCardHref={(row) =>
          generatePath(CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE, {
            catalogPlanId,
            appliedRateCardId: row.id,
          })
        }
        onCopyRateCardCode={(row) => {
          copyToClipboard(row.rateCard.code)
          addToast({ severity: 'info', translateKey: 'text_1775559630554ourrtpgddty' })
        }}
        onRemoveRateCard={(row) =>
          openRemoveAppliedRateCardDialog({
            context: 'plan',
            id: row.id,
            rateCardName: row.rateCard.name,
            onRemoved: () => {
              refetch()

              client.cache.modify({
                id: client.cache.identify({ __typename: 'CatalogPlan', id: catalogPlanId }),
                fields: {
                  appliedRateCardsCount: (existing = 0) => Math.max(existing - 1, 0),
                },
              })
            },
          })
        }
      />
    </section>
  )
}
