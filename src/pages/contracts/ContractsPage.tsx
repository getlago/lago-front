import { gql } from '@apollo/client'
import { useState } from 'react'
import { generatePath } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Status } from '~/components/designSystem/Status'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { formatCountToMetadata } from '~/components/MainHeader/formatCountToMetadata'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { CONTRACT_DETAILS_ROUTE } from '~/core/router'
import { ContractForContractsListFragment, useGetContractsListQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment ContractForContractsList on Contract {
    id
    name
    externalId
    status
    startedAt
    endedAt
    customer {
      id
      displayName
    }
  }

  query getContractsList($page: Int, $limit: Int) {
    contracts(page: $page, limit: $limit) {
      collection {
        ...ContractForContractsList
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }
`

const ContractsPage = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { page, goToPage } = usePageSearchParam()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const { data, loading, error, refetch } = useGetContractsListQuery({
    variables: { page, limit: pageSize },
    notifyOnNetworkStatusChange: true,
  })
  const totalCount = data?.contracts.metadata.totalCount

  const columns: TableColumn<ContractForContractsListFragment>[] = [
    {
      key: 'status',
      title: translate('text_62d7f6178ec94cd09370e5fb'),
      content: ({ status }) => <Status {...contractStatusMapping(status)} />,
    },
    {
      key: 'name',
      title: translate('text_6419c64eace749372fc72b0f'),
      content: ({ name, externalId }) => (
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {name || externalId}
        </Typography>
      ),
    },
    {
      key: 'customer.displayName',
      title: translate('text_63ac86d797f728a87b2f9fb3'),
      maxSpace: true,
      tdCellClassName: 'max-w-0',
      content: ({ customer }) => (
        <Typography variant="body" noWrap>
          {customer.displayName}
        </Typography>
      ),
    },
    {
      key: 'startedAt',
      title: translate('text_65201c5a175a4b0238abf29e'),
      textAlign: 'right',
      content: ({ startedAt }) => (
        <Typography variant="body" noWrap>
          {startedAt ? intlFormatDateTimeOrgaTZ(startedAt).date : '-'}
        </Typography>
      ),
    },
    {
      key: 'endedAt',
      title: translate('text_65201c5a175a4b0238abf2a0'),
      textAlign: 'right',
      content: ({ endedAt }) => (
        <Typography variant="body" noWrap>
          {endedAt ? intlFormatDateTimeOrgaTZ(endedAt).date : '-'}
        </Typography>
      ),
    },
  ]

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: translate('text_17894894166553ysarr965xr'),
          metadata: formatCountToMetadata(totalCount, translate),
          metadataLoading: loading && totalCount === undefined,
        }}
        filtersSection={
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchInput disabled placeholder={translate('text_1789489416655gvo52mdwtur')} />
            <Button disabled startIcon="filter" size="small" variant="quaternary">
              {translate('text_66ab42d4ece7e6b7078993ad')}
            </Button>
          </div>
        }
      />
      <PaginatedContent
        insetPager
        metadata={error ? undefined : data?.contracts.metadata}
        loading={loading}
        pageSize={pageSize}
        onPageChange={goToPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          goToPage(1)
        }}
      >
        <Table
          name="contracts-list"
          data={data?.contracts.collection ?? []}
          columns={columns}
          rowSize={48}
          containerSize={{ default: 16, md: 48 }}
          containerClassName="-mb-px h-auto shrink-0 border-t border-grey-300"
          isLoading={loading}
          loadingRowCount={pageSize}
          hasError={!!error}
          onRowActionLink={({ id }) => generatePath(CONTRACT_DETAILS_ROUTE, { id })}
          rowLinkLabel={({ name, externalId }) => name || externalId}
          placeholder={{
            emptyState: {
              title: translate('text_1789030049530zaego9s9413'),
              subtitle: translate('text_1789489416655cg75diwmbkv'),
            },
            errorState: {
              title: translate('text_629728388c4d2300e2d380d5'),
              subtitle: translate('text_629728388c4d2300e2d380eb'),
              buttonTitle: translate('text_629728388c4d2300e2d38110'),
              buttonVariant: 'primary',
              buttonAction: () => void refetch(),
            },
          }}
        />
      </PaginatedContent>
    </>
  )
}

export default ContractsPage
