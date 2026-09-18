import { fireEvent, screen } from '@testing-library/react'
import { ReactNode } from 'react'

import { TableProps } from '~/components/designSystem/Table/Table'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CONTRACT_DETAILS_ROUTE } from '~/core/router'
import {
  ContractForCustomerContractsListFragment,
  ContractStatusEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { CUSTOMER_CONTRACTS_CREATE_TEST_ID, CustomerContractsList } from '../CustomerContractsList'

const mockTableProps = jest.fn()
const mockPaginatedContentProps = jest.fn()
const mockUseGetCustomerContractsListQuery = jest.fn()
const mockGoToPage = jest.fn()
const mockRefetch = jest.fn()
const mockOpenContractDrawer = jest.fn()
const mockHasPermissions = jest.fn<boolean, [string[]]>(() => true)
const mockGetContractTableActions = jest.fn(() => [])
const mockTimezoneDateProps = jest.fn()

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: (props: { children: ReactNode }) => {
    mockPaginatedContentProps(props)
    return <>{props.children}</>
  },
  usePageSearchParam: () => ({ page: 2, goToPage: mockGoToPage }),
}))

jest.mock('~/components/TimezoneDate', () => ({
  TimezoneDate: (props: Record<string, unknown>) => {
    mockTimezoneDateProps(props)
    return <span>{String(props.date)}</span>
  },
}))

jest.mock('~/components/contracts/useContractTableActions', () => ({
  useContractTableActions: () => ({
    getContractTableActions: mockGetContractTableActions,
    contractTableActionsTooltip: 'Copy ID, terminate',
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerContractsListQuery: (options: Record<string, unknown>) =>
    mockUseGetCustomerContractsListQuery(options),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/pages/contracts/drawers/contract/useContractDrawer', () => ({
  useContractDrawer: () => ({ openDrawer: mockOpenContractDrawer }),
}))

const customer = {
  externalId: 'acme-external',
  displayName: 'Acme Inc.',
  applicableTimezone: TimezoneEnum.TzAmericaNewYork,
  billingEntity: {
    id: 'billing-entity-1',
  },
}

const contract: ContractForCustomerContractsListFragment = {
  __typename: 'Contract',
  id: 'contract-1',
  name: 'Enterprise agreement',
  externalId: 'enterprise-2026',
  status: ContractStatusEnum.Active,
  startedAt: '2026-06-11T00:00:00Z',
  endedAt: '2027-06-11T00:00:00Z',
  plan: { __typename: 'CatalogPlan', id: 'plan-1', name: 'Enterprise plan' },
}

const metadata = { currentPage: 2, totalPages: 3, totalCount: 45 }

const defaultQueryState = {
  data: {
    contracts: {
      __typename: 'ContractCollection',
      collection: [contract],
      metadata,
    },
  },
  loading: false,
  error: undefined,
  refetch: mockRefetch,
}

const getTableProps = (): TableProps<ContractForCustomerContractsListFragment> =>
  mockTableProps.mock.calls[0][0]

describe('CustomerContractsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockUseGetCustomerContractsListQuery.mockReturnValue(defaultQueryState)
  })

  it('fetches the current customer contracts with fresh-data semantics', () => {
    render(<CustomerContractsList customer={customer} />)

    expect(mockUseGetCustomerContractsListQuery).toHaveBeenCalledWith({
      variables: {
        externalCustomerId: 'acme-external',
        page: 2,
        limit: DEFAULT_PAGE_SIZE,
      },
      skip: false,
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  })

  it('matches the customer overview table and pagination structure', () => {
    render(<CustomerContractsList customer={customer} />)

    expect(getTableProps()).toEqual(
      expect.objectContaining({
        name: 'customer-contracts',
        data: [contract],
        containerSize: 0,
        rowSize: 48,
        isLoading: false,
        hasError: false,
        loadingRowCount: DEFAULT_PAGE_SIZE,
      }),
    )
    expect(getTableProps().columns.map((column) => column?.key)).toEqual([
      'status',
      'name',
      'startedAt',
      'endedAt',
    ])
    expect(getTableProps().columns[1]).toEqual(expect.objectContaining({ maxSpace: true }))
    expect(mockPaginatedContentProps).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata,
        loading: false,
        sticky: false,
        onPageChange: mockGoToPage,
      }),
    )
  })

  it('uses the global contract route and the shared row actions', () => {
    render(<CustomerContractsList customer={customer} />)

    expect(getTableProps().onRowActionLink?.(contract)).toBe(
      CONTRACT_DETAILS_ROUTE.replace(':id', 'contract-1'),
    )
    expect(getTableProps().rowLinkLabel?.(contract)).toBe('Enterprise agreement')
    expect(getTableProps().actionColumn).toBe(mockGetContractTableActions)
    expect(getTableProps().actionColumnTooltip?.(contract)).toBe('Copy ID, terminate')
  })

  it('falls back to the plan name when the contract has no name', () => {
    render(<CustomerContractsList customer={customer} />)

    const unnamedContract = { ...contract, name: null }
    const nameColumn = getTableProps().columns.find((column) => column?.key === 'name')

    render(<>{nameColumn?.content(unnamedContract)}</>)

    expect(screen.getByText('Enterprise plan')).toBeInTheDocument()
    expect(getTableProps().rowLinkLabel?.(unnamedContract)).toBe('Enterprise plan')
  })

  it('displays organization-timezone dates with the existing customer-timezone tooltip', () => {
    render(<CustomerContractsList customer={customer} />)

    const startedAtColumn = getTableProps().columns.find((column) => column?.key === 'startedAt')
    const endedAtColumn = getTableProps().columns.find((column) => column?.key === 'endedAt')

    render(
      <>
        {startedAtColumn?.content(contract)}
        {endedAtColumn?.content(contract)}
      </>,
    )

    expect(mockTimezoneDateProps).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        date: contract.startedAt,
        customerTimezone: TimezoneEnum.TzAmericaNewYork,
      }),
    )
    expect(mockTimezoneDateProps).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        date: contract.endedAt,
        customerTimezone: TimezoneEnum.TzAmericaNewYork,
      }),
    )
    expect(mockTimezoneDateProps.mock.calls[0][0]).not.toHaveProperty('mainTimezone')
    expect(mockTimezoneDateProps.mock.calls[1][0]).not.toHaveProperty('mainTimezone')
  })

  it('keeps the stable skeleton while the query is loading', () => {
    mockUseGetCustomerContractsListQuery.mockReturnValue({
      ...defaultQueryState,
      data: undefined,
      loading: true,
    })

    render(<CustomerContractsList customer={customer} />)

    expect(getTableProps().isLoading).toBe(true)
    expect(getTableProps().loadingRowCount).toBe(DEFAULT_PAGE_SIZE)
    expect(mockPaginatedContentProps).toHaveBeenCalledWith(
      expect.objectContaining({ loading: true }),
    )
  })

  it('uses the Maneki table empty state when the customer has no contracts', () => {
    mockUseGetCustomerContractsListQuery.mockReturnValue({
      ...defaultQueryState,
      data: {
        contracts: {
          ...defaultQueryState.data.contracts,
          collection: [],
          metadata: { currentPage: 1, totalPages: 0, totalCount: 0 },
        },
      },
    })

    render(<CustomerContractsList customer={customer} />)

    expect(getTableProps().placeholder?.emptyState).toEqual({
      title: 'No contract yet',
      subtitle: 'This customer’s contracts will appear here.',
    })
    expect(getTableProps().placeholder?.emptyState?.image).toBeUndefined()
  })

  it('shows the table error state without pager metadata and retries the query', () => {
    mockUseGetCustomerContractsListQuery.mockReturnValue({
      ...defaultQueryState,
      data: undefined,
      error: new Error('temporarily unavailable'),
    })

    render(<CustomerContractsList customer={customer} />)

    expect(getTableProps().hasError).toBe(true)
    expect(mockPaginatedContentProps).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: undefined }),
    )

    getTableProps().placeholder?.errorState?.buttonAction?.()
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('opens the contract drawer with the customer and affiliated entity preselected', () => {
    render(<CustomerContractsList customer={customer} />)

    const createButton = screen.getByRole('button', { name: 'Create a contract' })

    expect(createButton).toHaveAttribute('data-test', CUSTOMER_CONTRACTS_CREATE_TEST_ID)
    fireEvent.click(createButton)

    expect(mockOpenContractDrawer).toHaveBeenCalledWith({
      customer: {
        externalId: 'acme-external',
        displayName: 'Acme Inc.',
        applicableTimezone: TimezoneEnum.TzAmericaNewYork,
        billingEntityId: 'billing-entity-1',
      },
    })
  })

  it('hides only the create action without contractsCreate permission', () => {
    mockHasPermissions.mockImplementation((permissions) => !permissions.includes('contractsCreate'))

    render(<CustomerContractsList customer={customer} />)

    expect(screen.queryByRole('button', { name: 'Create a contract' })).not.toBeInTheDocument()
    expect(mockUseGetCustomerContractsListQuery).toHaveBeenCalledTimes(1)
    expect(getTableProps().data).toEqual([contract])
  })
})
