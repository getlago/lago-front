import { gql } from '@apollo/client'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Status } from '~/components/designSystem/Status'
import { Table, TableColumn, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { PageSectionTitle } from '~/components/layouts/Section'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import {
  ContractForCatalogPlanContractsFragment,
  useGetCatalogPlanContractsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment ContractForCatalogPlanContracts on Contract {
    id
    name
    externalId
    status
    startedAt
    endedAt
  }

  query getCatalogPlanContracts($page: Int, $limit: Int, $planCode: String) {
    contracts(page: $page, limit: $limit, planCode: $planCode) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...ContractForCatalogPlanContracts
      }
    }
  }
`

type CatalogPlanContractsProps = {
  planCode?: string
}

export const CatalogPlanContracts = ({ planCode }: CatalogPlanContractsProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { page, goToPage } = usePageSearchParam()

  const { data, loading, error } = useGetCatalogPlanContractsQuery({
    variables: { planCode, limit: DEFAULT_PAGE_SIZE, page },
    skip: !planCode,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  const columns: TableColumn<ContractForCatalogPlanContractsFragment>[] = [
    {
      key: 'status',
      title: translate('text_62d7f6178ec94cd09370e5fb'),
      minWidth: 120,
      content: ({ status }) => <Status {...contractStatusMapping(status)} />,
    },
    {
      key: 'name',
      title: translate('text_6419c64eace749372fc72b0f'),
      maxSpace: true,
      minWidth: 200,
      content: ({ name, externalId }) => (
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {name || externalId}
        </Typography>
      ),
    },
    {
      key: 'startedAt',
      textAlign: 'right',
      title: translate('text_65201c5a175a4b0238abf29e'),
      minWidth: 150,
      content: ({ startedAt }) => (
        <Typography variant="body" color="grey600" noWrap>
          {startedAt ? intlFormatDateTimeOrgaTZ(startedAt).date : '-'}
        </Typography>
      ),
    },
    {
      key: 'endedAt',
      textAlign: 'right',
      title: translate('text_65201c5a175a4b0238abf2a0'),
      minWidth: 150,
      content: ({ endedAt }) => (
        <Typography variant="body" color="grey600" noWrap>
          {endedAt ? intlFormatDateTimeOrgaTZ(endedAt).date : '-'}
        </Typography>
      ),
    },
  ]

  const placeholder: TablePlaceholder = {
    emptyState: {
      title: translate('text_1789030049530zaego9s9413'),
      subtitle: translate('text_1789030049530fpa31j8cd53'),
    },
    errorState: {
      title: translate('text_629728388c4d2300e2d380d5'),
      subtitle: translate('text_629728388c4d2300e2d380eb'),
      buttonTitle: translate('text_629728388c4d2300e2d38110'),
      buttonVariant: 'primary',
      buttonAction: () => location.reload(),
    },
  }

  return (
    <section className="flex flex-1 flex-col px-4 pt-6 md:px-12">
      <PageSectionTitle
        title={translate('text_1789463364350r8k8jukikz1')}
        subtitle={translate('text_1789463364350p2k2yremb26')}
      />
      <PaginatedContent
        metadata={data?.contracts?.metadata}
        loading={loading || !planCode}
        onPageChange={goToPage}
      >
        <Table
          name="catalog-plan-contracts"
          data={data?.contracts?.collection ?? []}
          containerSize={4}
          containerClassName="-mb-px h-auto shrink-0 border-t border-grey-300"
          rowSize={48}
          isLoading={loading || !planCode}
          hasError={!!error}
          columns={columns}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </section>
  )
}
