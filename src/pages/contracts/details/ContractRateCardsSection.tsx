import { gql, useApolloClient } from '@apollo/client'
import { generatePath } from 'react-router'

import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { buildSearchAwareTablePlaceholder } from '~/components/designSystem/Table/buildSearchAwareTablePlaceholder'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { AppliedRateCardsTable } from '~/components/rateCards/AppliedRateCardsTable'
import { useRemoveAppliedRateCardDialog } from '~/components/rateCards/dialogs/useRemoveAppliedRateCardDialog'
import { SearchInput } from '~/components/SearchInput'
import { addToast } from '~/core/apolloClient'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CONTRACT_RATE_CARD_DETAILS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useGetContractAppliedRateCardsForRateCardsSectionLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'

gql`
  fragment ContractAppliedRateCardForRateCardsSection on ContractAppliedRateCard {
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

  query getContractAppliedRateCardsForRateCardsSection(
    $contractId: ID!
    $page: Int
    $limit: Int
    $searchTerm: String
  ) {
    contractAppliedRateCards(
      contractId: $contractId
      page: $page
      limit: $limit
      searchTerm: $searchTerm
    ) {
      collection {
        ...ContractAppliedRateCardForRateCardsSection
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

type ContractRateCardsSectionProps = {
  contractId: string
}

export const ContractRateCardsSection = ({
  contractId,
}: ContractRateCardsSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const client = useApolloClient()
  const { page, goToPage } = usePageSearchParam()
  const { openRemoveAppliedRateCardDialog } = useRemoveAppliedRateCardDialog()

  // network-only: the section remounts on every tab switch, so a cache-first read would
  // flash the previously viewed page.
  const [getContractAppliedRateCards, { data, error, loading, variables, refetch }] =
    useGetContractAppliedRateCardsForRateCardsSectionLazyQuery({
      variables: { contractId, page, limit: DEFAULT_PAGE_SIZE },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getContractAppliedRateCards, loading)

  const canRemoveRateCard = hasPermissions(['contractsUpdate'])

  const searchInputOnChange = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  const rows = data?.contractAppliedRateCards?.collection ?? []

  const placeholder = buildSearchAwareTablePlaceholder({
    translate,
    hasSearchTerm: !!variables?.searchTerm,
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

      <SearchInput
        onChange={searchInputOnChange}
        placeholder={translate('text_17849293094725tv045xhkxf')}
        data-test="contract-rate-cards-search-input"
      />

      <AppliedRateCardsTable
        rows={rows}
        metadata={data?.contractAppliedRateCards?.metadata}
        loading={isLoading}
        hasError={!!error}
        placeholder={placeholder}
        canRemove={canRemoveRateCard}
        onPageChange={goToPage}
        getRateCardHref={(row) =>
          generatePath(CONTRACT_RATE_CARD_DETAILS_ROUTE, {
            id: contractId,
            appliedRateCardId: row.id,
          })
        }
        onCopyRateCardCode={(row) => {
          copyToClipboard(row.rateCard.code)
          addToast({ severity: 'info', translateKey: 'text_1775559630554ourrtpgddty' })
        }}
        onRemoveRateCard={(row) =>
          openRemoveAppliedRateCardDialog({
            context: 'contract',
            id: row.id,
            rateCardName: row.rateCard.name,
            onRemoved: () => {
              refetch()

              client.cache.modify({
                id: client.cache.identify({ __typename: 'Contract', id: contractId }),
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
