import { MockedResponse } from '@apollo/client/testing'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CONTRACTS_ROUTE, objectListRoutes } from '~/core/router/ObjectsRoutes'
import {
  ContractForContractsListFragment,
  ContractStatusEnum,
  FeatureFlagEnum,
  GetContractsListDocument,
  GetContractsListQuery,
  GetContractsListQueryVariables,
} from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import ContractsPage from '../ContractsPage'

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (date: string) => ({ date: date.slice(0, 10) }),
  }),
}))

const contract: ContractForContractsListFragment = {
  __typename: 'Contract',
  id: 'contract-1',
  status: ContractStatusEnum.Active,
  name: 'Enterprise agreement',
  externalId: 'enterprise-2026',
  startedAt: '2026-06-11T00:00:00Z',
  endedAt: null,
  customer: { __typename: 'Customer', id: 'customer-1', displayName: 'Acme Inc.' },
}

const contractsMock = (
  collection: ContractForContractsListFragment[] = [contract],
  page = 1,
  totalCount = 45,
): MockedResponse<GetContractsListQuery, GetContractsListQueryVariables> => ({
  request: {
    query: GetContractsListDocument,
    variables: { page, limit: DEFAULT_PAGE_SIZE },
  },
  result: {
    data: {
      contracts: {
        collection,
        metadata: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / DEFAULT_PAGE_SIZE),
          totalCount,
        },
      },
    },
  },
})

describe('ContractsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/acme/contracts')
  })

  it('renders contract data and disables search and filters until server support is available', async () => {
    render(
      <>
        <MainHeader />
        <ContractsPage />
      </>,
      { mocks: [contractsMock()] },
    )

    expect(await screen.findByText('Enterprise agreement')).toBeInTheDocument()
    expect(screen.getByText('Acme Inc.')).toBeInTheDocument()
    expect(screen.getByText('2026-06-11')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search contracts')).toBeDisabled()
    expect(screen.getByRole('button', { name: /filters/i })).toBeDisabled()
    expect(screen.getByText('Contracts')).toBeInTheDocument()

    const headers = screen.getAllByRole('columnheader')

    expect(headers.map((header) => header.textContent)).toEqual([
      'Status',
      'Name',
      'Customer name',
      'Start date',
      'End date',
    ])
    expect(headers[2]).toHaveStyle({ width: '100%' })
    expect(headers[1]).toHaveStyle({ width: 'auto' })
  })

  it('uses the URL page and lets the sticky pager navigate to the next page', async () => {
    window.history.replaceState({}, '', '/acme/contracts?page=2')
    render(<ContractsPage />, { mocks: [contractsMock([contract], 2, 41)] })

    expect(await screen.findByText('Enterprise agreement')).toBeInTheDocument()

    const pager = screen.getByRole('navigation', { name: 'pagination' })
    const tableContainer = screen.getByTestId('table-contracts-list').parentElement

    expect(pager).toHaveClass('sticky', 'bottom-0', 'mt-auto')
    expect(tableContainer).toHaveClass('-mb-px', 'h-auto', 'shrink-0')
    expect(tableContainer?.nextElementSibling).toBe(pager)
    fireEvent.click(within(pager).getByRole('button', { name: 'next page' }))
    expect(testMockNavigateFn).toHaveBeenCalledWith({ search: 'page=3' }, { replace: true })
  })

  it('hides pagination when all contracts fit within the default 20-row page', async () => {
    render(<ContractsPage />, { mocks: [contractsMock([contract], 1, DEFAULT_PAGE_SIZE)] })

    expect(await screen.findByText('Enterprise agreement')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument()
  })

  it('links rows to contract details and supports pointer and keyboard navigation', async () => {
    render(<ContractsPage />, { mocks: [contractsMock()] })

    const row = await screen.findByTestId('table-row-0')
    const link = within(row).getByRole('link', { name: 'Enterprise agreement' })

    expect(row).toHaveAttribute('tabindex', '0')
    expect(row).toHaveClass('cursor-pointer')
    expect(link).toHaveAttribute('href', '/contracts/contract-1')

    fireEvent.click(row)
    expect(testMockNavigateFn).toHaveBeenCalledWith('/contracts/contract-1')

    testMockNavigateFn.mockClear()
    row.focus()
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' })
    expect(testMockNavigateFn).toHaveBeenCalledWith('/contracts/contract-1')
  })

  it('shows loading controls while fetching and the empty state after an empty response', async () => {
    render(<ContractsPage />, { mocks: [{ ...contractsMock([], 1, 0), delay: 30 }] })

    expect(screen.getByRole('button', { name: 'next page' })).toBeDisabled()
    expect(await screen.findByText('No contract yet')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument()
  })

  it('falls back to the external ID when the contract has no name', async () => {
    render(<ContractsPage />, { mocks: [contractsMock([{ ...contract, name: null }])] })

    expect(await screen.findByText('enterprise-2026')).toBeInTheDocument()
  })

  it('retries failed requests without reloading the page', async () => {
    const failedMock = {
      request: contractsMock().request,
      error: new Error('Contracts temporarily unavailable'),
    }

    render(<ContractsPage />, { mocks: [failedMock, contractsMock()] })

    const retry = await screen.findByRole('button', { name: /refresh/i })

    expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument()
    fireEvent.click(retry)
    await waitFor(() => expect(screen.getByText('Enterprise agreement')).toBeInTheDocument())
  })
  it('registers the list route behind the contractsView permission and ProductCatalog flag', () => {
    const route = objectListRoutes.find(
      ({ path }) => Array.isArray(path) && path.includes(CONTRACTS_ROUTE),
    )

    expect(CONTRACTS_ROUTE).toBe('/contracts')
    expect(route).toEqual(
      expect.objectContaining({
        private: true,
        permissions: ['contractsView'],
        featureFlag: FeatureFlagEnum.ProductCatalog,
      }),
    )
  })
})
