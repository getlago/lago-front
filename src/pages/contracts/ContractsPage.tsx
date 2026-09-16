import { gql } from '@apollo/client'
import { useState } from 'react'
import { generatePath } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Status } from '~/components/designSystem/Status'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { formatCountToMetadata } from '~/components/MainHeader/formatCountToMetadata'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { SearchInput } from '~/components/SearchInput'
import { addToast } from '~/core/apolloClient'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { CONTRACT_DETAILS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { ContractForContractsListFragment, useGetContractsListLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

import { useContractDrawer } from './drawers/contract/useContractDrawer'

export const CONTRACTS_CREATE_TEST_ID = 'contracts-create'

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
  const { openDrawer: openContractDrawer } = useContractDrawer()
  const { hasPermissions } = usePermissions()
  const { page, goToPage } = usePageSearchParam()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [getContracts, { data, loading, error, refetch }] = useGetContractsListLazyQuery({
    variables: { page, limit: pageSize },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { isLoading } = useDebouncedSearch(getContracts, loading)
  const totalCount = data?.contracts.metadata.totalCount

  const actions: MainHeaderAction[] = [
    {
      type: 'action',
      label: translate('text_1789553562287qzstcfu6er0'),
      variant: 'primary',
      hidden: !hasPermissions(['contractsCreate']),
      dataTest: CONTRACTS_CREATE_TEST_ID,
      onClick: () => openContractDrawer(),
    },
  ]

  const getActions = (
    contract: ContractForContractsListFragment,
  ): ActionItem<ContractForContractsListFragment>[] => [
    {
      startIcon: 'duplicate',
      title: translate('text_1789636691484c9hodzevcvd'),
      dataTest: 'copy-contract-external-id',
      onAction: () => {
        copyToClipboard(contract.externalId)
        addToast({
          severity: 'info',
          translateKey: 'text_1789636691484fyt51yyc9uh',
        })
      },
    },
  ]

  const columns: TableColumn<ContractForContractsListFragment>[] = [
    {
      key: 'status',
      title: translate('text_62d7f6178ec94cd09370e5fb'),
      minWidth: 80,
      content: ({ status }) => <Status {...contractStatusMapping(status)} />,
    },
    {
      key: 'name',
      title: translate('text_6419c64eace749372fc72b0f'),
      minWidth: 200,
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
      minWidth: 200,
      content: ({ customer }) => (
        <Typography variant="body" noWrap>
          {customer.displayName}
        </Typography>
      ),
    },
    {
      key: 'startedAt',
      title: translate('text_65201c5a175a4b0238abf29e'),
      minWidth: 140,
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
      minWidth: 140,
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
          metadataLoading: isLoading && totalCount === undefined,
        }}
        actions={{ items: actions }}
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
        loading={isLoading}
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
          isLoading={isLoading}
          loadingRowCount={pageSize}
          hasError={!!error}
          onRowActionLink={({ id }) => generatePath(CONTRACT_DETAILS_ROUTE, { id })}
          rowLinkLabel={({ name, externalId }) => name || externalId}
          actionColumnTooltip={() => translate('text_637f813d31381b1ed90ab326')}
          actionColumn={getActions}
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
