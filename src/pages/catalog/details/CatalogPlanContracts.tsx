import { gql } from '@apollo/client'

import { computeCustomerInitials } from '~/components/customers/utils'
import { Avatar } from '~/components/designSystem/Avatar'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Status } from '~/components/designSystem/Status'
import { Table, TableColumn, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { intlFormatDateTime } from '~/core/timezone'
import {
  ContractForCatalogPlanContractsFragment,
  useGetCatalogPlanContractsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment ContractForCatalogPlanContracts on Contract {
    id
    status
    startedAt
    endedAt
    customer {
      id
      name
      displayName
      externalId
    }
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
  const { page, goToPage } = usePageSearchParam()

  const { data, loading, error } = useGetCatalogPlanContractsQuery({
    variables: { planCode: planCode as string, limit: DEFAULT_PAGE_SIZE, page },
    skip: !planCode,
    notifyOnNetworkStatusChange: true,
  })

  const columns: TableColumn<ContractForCatalogPlanContractsFragment>[] = [
    {
      key: 'customer.displayName',
      title: translate('text_624efab67eb2570101d117be'),
      maxSpace: true,
      minWidth: 340,
      content: ({ customer }) => (
        <div className="flex items-center gap-3">
          <Avatar
            size="big"
            variant="user"
            identifier={customer.displayName}
            initials={computeCustomerInitials(customer)}
          />
          <div className="flex flex-col">
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {customer.displayName}
            </Typography>
            <TypographyWithCopy variant="caption" color="grey600" noWrap>
              {customer.externalId}
            </TypographyWithCopy>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: translate('text_62d7f6178ec94cd09370e5fb'),
      minWidth: 120,
      content: ({ status }) => <Status {...contractStatusMapping(status)} />,
    },
    {
      key: 'startedAt',
      title: translate('text_65201c5a175a4b0238abf29e'),
      minWidth: 150,
      content: ({ startedAt }) => (
        <Typography variant="body" color="grey700">
          {startedAt ? intlFormatDateTime(startedAt).date : '-'}
        </Typography>
      ),
    },
    {
      key: 'endedAt',
      title: translate('text_65201c5a175a4b0238abf2a0'),
      minWidth: 150,
      content: ({ endedAt }) => (
        <Typography variant="body" color="grey700">
          {endedAt ? intlFormatDateTime(endedAt).date : '-'}
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
    <section>
      <PaginatedContent
        metadata={data?.contracts?.metadata}
        loading={loading}
        onPageChange={goToPage}
        sticky={false}
      >
        <Table
          name="catalog-plan-contracts"
          data={data?.contracts?.collection ?? []}
          containerSize={0}
          containerClassName="border-t border-grey-300"
          rowSize={72}
          isLoading={loading}
          hasError={!!error}
          columns={columns}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </section>
  )
}
