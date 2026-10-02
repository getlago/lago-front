import { gql } from '@apollo/client'
import { generatePath } from 'react-router'

import { ContractsList } from '~/components/contracts/ContractsList'
import { useContractDrawer } from '~/components/contracts/drawers/contract/useContractDrawer'
import { getContractDisplayName } from '~/components/contracts/getContractDisplayName'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Status } from '~/components/designSystem/Status'
import { TableColumn, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { PageSectionTitle } from '~/components/layouts/Section'
import { TimezoneDate } from '~/components/TimezoneDate'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { CONTRACT_DETAILS_ROUTE } from '~/core/router'
import {
  ContractForContractsListItemFragmentDoc,
  ContractForCustomerContractsListFragment,
  TimezoneEnum,
  useGetCustomerContractsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

export const CUSTOMER_CONTRACTS_CREATE_TEST_ID = 'customer-contracts-create'

gql`
  fragment ContractForCustomerContractsList on Contract {
    id
    name
    externalId
    status
    startedAt
    endedAt
    plan {
      id
      name
    }
    ...ContractForContractsListItem
  }

  query getCustomerContractsList($externalCustomerId: String!, $page: Int, $limit: Int) {
    contracts(externalCustomerId: $externalCustomerId, page: $page, limit: $limit) {
      collection {
        ...ContractForCustomerContractsList
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  ${ContractForContractsListItemFragmentDoc}
`

type CustomerContractsListProps = {
  customer: {
    externalId: string
    displayName: string
    applicableTimezone: TimezoneEnum
    billingEntity: { id: string }
  }
}

export const CustomerContractsList = ({ customer }: CustomerContractsListProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer: openContractDrawer } = useContractDrawer()
  const { page, goToPage } = usePageSearchParam()

  const { data, loading, error, refetch } = useGetCustomerContractsListQuery({
    variables: {
      externalCustomerId: customer.externalId,
      page,
      limit: DEFAULT_PAGE_SIZE,
    },
    skip: !customer.externalId,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  const columns: TableColumn<ContractForCustomerContractsListFragment>[] = [
    {
      key: 'status',
      title: translate('text_62d7f6178ec94cd09370e5fb'),
      minWidth: 120,
      content: ({ status }) => <Status {...contractStatusMapping(status)} />,
    },
    {
      key: 'name',
      title: translate('text_1789552637141273ewsjqx7j'),
      maxSpace: true,
      minWidth: 200,
      content: (contract) => (
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {getContractDisplayName(contract)}
        </Typography>
      ),
    },
    {
      key: 'startedAt',
      title: translate('text_65201c5a175a4b0238abf29e'),
      minWidth: 150,
      textAlign: 'right',
      content: ({ startedAt }) =>
        startedAt ? (
          <TimezoneDate
            date={startedAt}
            customerTimezone={customer.applicableTimezone}
            mainTypographyProps={{ variant: 'body', color: 'grey600', noWrap: true }}
          />
        ) : (
          <Typography>-</Typography>
        ),
    },
    {
      key: 'endedAt',
      title: translate('text_65201c5a175a4b0238abf2a0'),
      minWidth: 150,
      textAlign: 'right',
      content: ({ endedAt }) =>
        endedAt ? (
          <TimezoneDate
            date={endedAt}
            customerTimezone={customer.applicableTimezone}
            mainTypographyProps={{ variant: 'body', color: 'grey600', noWrap: true }}
          />
        ) : (
          <Typography>-</Typography>
        ),
    },
  ]

  const placeholder: TablePlaceholder = {
    emptyState: {
      title: translate('text_1789030049530zaego9s9413'),
      subtitle: translate('text_1789652109699qmz7squ6wr3'),
    },
    errorState: {
      title: translate('text_629728388c4d2300e2d380d5'),
      subtitle: translate('text_629728388c4d2300e2d380eb'),
      buttonTitle: translate('text_629728388c4d2300e2d38110'),
      buttonVariant: 'primary',
      buttonAction: () => void refetch(),
    },
  }

  return (
    <section>
      <PageSectionTitle
        title={translate('text_17894894166553ysarr965xr')}
        subtitle={translate('text_178965210969958i1zni4czl')}
        action={
          hasPermissions(['contractsCreate'])
            ? {
                title: translate('text_1789553562287qzstcfu6er0'),
                dataTest: CUSTOMER_CONTRACTS_CREATE_TEST_ID,
                onClick: () =>
                  openContractDrawer({
                    customer: {
                      externalId: customer.externalId,
                      displayName: customer.displayName,
                      applicableTimezone: customer.applicableTimezone,
                      billingEntityId: customer.billingEntity.id,
                    },
                  }),
              }
            : undefined
        }
      />

      <PaginatedContent
        metadata={error ? undefined : data?.contracts.metadata}
        loading={loading}
        onPageChange={goToPage}
        sticky={false}
      >
        <ContractsList
          name="customer-contracts"
          contracts={data?.contracts.collection ?? []}
          columns={columns}
          containerSize={0}
          containerClassName="border-t border-grey-300"
          rowSize={48}
          isLoading={loading}
          hasError={!!error}
          loadingRowCount={DEFAULT_PAGE_SIZE}
          onRowActionLink={({ id }) => generatePath(CONTRACT_DETAILS_ROUTE, { id })}
          placeholder={placeholder}
        />
      </PaginatedContent>
    </section>
  )
}

CustomerContractsList.displayName = 'CustomerContractsList'
