import { gql } from '@apollo/client'
import { useMemo, useState } from 'react'
import { generatePath, useSearchParams } from 'react-router'

import { ContractsList } from '~/components/contracts/ContractsList'
import { getContractDisplayName } from '~/components/contracts/getContractDisplayName'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Status } from '~/components/designSystem/Status'
import { TableColumn, TablePlaceholder } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import {
  ContractAvailableFilters,
  Filters,
  formatFiltersForContractQuery,
} from '~/components/Filters'
import { formatCountToMetadata } from '~/components/MainHeader/formatCountToMetadata'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { SearchInput } from '~/components/SearchInput'
import { CONTRACT_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { contractStatusMapping } from '~/core/constants/statusContractMapping'
import { CONTRACT_DETAILS_ROUTE } from '~/core/router'
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
    plan {
      id
      name
    }
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
  const { openDrawer: openContractDrawer } = useContractDrawer()
  const { hasPermissions } = usePermissions()
  const { page, goToPage } = usePageSearchParam()
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const filtersForContractQuery = useMemo(
    () => formatFiltersForContractQuery(searchParams),
    [searchParams],
  )
  const [getContracts, { data, loading, error, variables }] = useGetContractsListLazyQuery({
    variables: { page, limit: pageSize, ...filtersForContractQuery },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getContracts, loading)
  const totalCount = data?.contracts.metadata.totalCount
  const hasSearchOrFilters =
    Object.keys(filtersForContractQuery).length > 0 || !!variables?.searchTerm

  const searchAndResetPage = (value: string): void => {
    goToPage(1)
    debouncedSearch?.(value)
  }

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
          {getContractDisplayName(contract)}
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

  const getPlaceholder = (): TablePlaceholder => ({
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
          buttonAction: () => location.reload(),
        },
  })

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
        <ContractsList
          name="contracts-list"
          contracts={data?.contracts.collection ?? []}
          columns={columns}
          rowSize={48}
          containerSize={{ default: 16, md: 48 }}
          containerClassName="-mb-px h-auto shrink-0 border-t border-grey-300"
          isLoading={isLoading}
          loadingRowCount={pageSize}
          hasError={!!error}
          onRowActionLink={({ id }) => generatePath(CONTRACT_DETAILS_ROUTE, { id })}
          placeholder={getPlaceholder()}
        />
      </PaginatedContent>
    </>
  )
}

export default ContractsPage
