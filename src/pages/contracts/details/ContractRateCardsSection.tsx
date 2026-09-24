import { gql } from '@apollo/client'

import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { AppliedRateCardsTable } from '~/components/rateCards/AppliedRateCardsTable'
import { useRemoveAppliedRateCardDialog } from '~/components/rateCards/dialogs/useRemoveAppliedRateCardDialog'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useGetContractAppliedRateCardsForRateCardsSectionLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'

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
  const { page, goToPage } = usePageSearchParam()
  const { openRemoveAppliedRateCardDialog } = useRemoveAppliedRateCardDialog()

  // network-only: this section is rendered from `renderSection()`, which returns a
  // different component per URL segment, so the section fully unmounts/remounts on
  // every tab switch — a cache-first read would flash the previously viewed page.
  const [getContractAppliedRateCards, { data, loading, refetch }] =
    useGetContractAppliedRateCardsForRateCardsSectionLazyQuery({
      variables: { contractId, page, limit: DEFAULT_PAGE_SIZE },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getContractAppliedRateCards, loading)

  const searchInputOnChange = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

  const rows = data?.contractAppliedRateCards?.collection ?? []

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
        onPageChange={goToPage}
        getRateCardHref={() => '#'}
        onCopyRateCardCode={(row) => copyToClipboard(row.rateCard.code)}
        onRemoveRateCard={(row) =>
          openRemoveAppliedRateCardDialog({
            context: 'contract',
            id: row.id,
            rateCardName: row.rateCard.name,
            onRemoved: () => refetch(),
          })
        }
      />
    </section>
  )
}
