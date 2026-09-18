import { gql } from '@apollo/client'
import { useMemo, useState } from 'react'
import { generatePath, useSearchParams } from 'react-router'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Status } from '~/components/designSystem/Status'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import {
  ContractAvailableFilters,
  Filters,
  formatFiltersForContractQuery,
} from '~/components/Filters'
import { formatCountToMetadata } from '~/components/MainHeader/formatCountToMetadata'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import { addToast } from '~/core/apolloClient'
import { CONTRACT_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { CONTRACT_DETAILS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { ContractForContractsListFragment, useGetContractsListLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
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

  query getContractsList(
    $page: Int
    $limit: Int
    $searchTerm: String
    $billingEntityIds: [ID!]
    $externalCustomerId: String
    $externalId: String
    $hasRateOverrides: Boolean
    $planCode: String
    $status: [ContractStatusEnum!]
  ) {
    contracts(
      page: $page
      limit: $limit
      searchTerm: $searchTerm
      billingEntityIds: $billingEntityIds
      externalCustomerId: $externalCustomerId
      externalId: $externalId
      hasRateOverrides: $hasRateOverrides
      planCode: $planCode
      status: $status
    ) {
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
  const [searchParams] = useSearchParams()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { page, goToPage } = usePageSearchParam()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const filtersForContractQuery = useMemo(
    () => formatFiltersForContractQuery(searchParams),
    [searchParams],
  )
  const [getContracts, { data, loading, error, refetch, variables }] = useGetContractsListLazyQuery(
    {
      variables: { page, limit: pageSize, ...filtersForContractQuery },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    },
  )
  const { debouncedSearch, isLoading } = useDebouncedSearch(getContracts, loading)
  const totalCount = data?.contracts.metadata.totalCount
  const hasSearchOrFilters =
    !!variables &&
    Object.entries(variables).some(([key, value]) => {
      if (key === 'page' || key === 'limit') return false
      if (Array.isArray(value)) return value.length > 0

      return value !== undefined && value !== null && value !== ''
    })

  const searchAndResetPage = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

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

  const getContractLabel = ({
    name,
    externalId,
  }: Pick<ContractForContractsListFragment, 'name' | 'externalId'>): string => name || externalId

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
      content: (contract) => (
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {getContractLabel(contract)}
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
        filtersSection={
          <Filters.Provider
            filtersNamePrefix={CONTRACT_LIST_FILTER_PREFIX}
            availableFilters={ContractAvailableFilters}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <SearchInput
                onChange={searchAndResetPage}
                placeholder={translate('text_1789489416655gvo52mdwtur')}
              />
              <Filters.Component />
            </div>
          </Filters.Provider>
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
          rowLinkLabel={getContractLabel}
          actionColumnTooltip={() => translate('text_637f813d31381b1ed90ab326')}
          actionColumn={getActions}
          placeholder={{
            emptyState: hasSearchOrFilters
              ? {
                  title: translate('text_1789752288687fltu5v8ujsm'),
                  subtitle: translate('text_66ab48ea4ed9cd01084c60b8'),
                }
              : {
                  title: translate('text_1789030049530zaego9s9413'),
                  subtitle: translate('text_1789489416655cg75diwmbkv'),
                },
            errorState: hasSearchOrFilters
              ? {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_63bab307a61c62af497e0599'),
                }
              : {
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
