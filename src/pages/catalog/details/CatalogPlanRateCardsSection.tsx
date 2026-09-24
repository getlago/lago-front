import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { PageSectionTitle } from '~/components/layouts/Section'
import { AppliedRateCardsTable } from '~/components/rateCards/AppliedRateCardsTable'
import { useRemoveAppliedRateCardDialog } from '~/components/rateCards/dialogs/useRemoveAppliedRateCardDialog'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useGetPlanAppliedRateCardsForRateCardsSectionLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

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
  const { page, goToPage } = usePageSearchParam()
  const { openRemoveAppliedRateCardDialog } = useRemoveAppliedRateCardDialog()

  // network-only: this section is rendered from `renderSection()`, which returns a
  // different component per URL segment, so the section fully unmounts/remounts on
  // every tab switch — a cache-first read would flash the previously viewed page.
  const [getPlanAppliedRateCards, { data, loading, refetch }] =
    useGetPlanAppliedRateCardsForRateCardsSectionLazyQuery({
      variables: { planId: catalogPlanId, page, limit: DEFAULT_PAGE_SIZE },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getPlanAppliedRateCards, loading)

  const searchInputOnChange = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  const rows = data?.planAppliedRateCards?.collection ?? []

  return (
    <section>
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
        onPageChange={goToPage}
        getRateCardHref={(row) =>
          generatePath(CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE, {
            catalogPlanId,
            appliedRateCardId: row.id,
          })
        }
        onCopyRateCardCode={(row) => copyToClipboard(row.rateCard.code)}
        onRemoveRateCard={(row) =>
          openRemoveAppliedRateCardDialog({
            context: 'plan',
            id: row.id,
            rateCardName: row.rateCard.name,
            onRemoved: () => refetch(),
          })
        }
      />
    </section>
  )
}
