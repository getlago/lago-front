import { MockedResponse } from '@apollo/client/testing'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { OPEN_ACTION_BUTTON_TEST_ID } from '~/components/designSystem/Table/Table'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { addToast } from '~/core/apolloClient'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { CONTRACTS_ROUTE, objectListRoutes } from '~/core/router/ObjectsRoutes'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
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

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

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
  variables: Partial<GetContractsListQueryVariables> = {},
): MockedResponse<GetContractsListQuery, GetContractsListQueryVariables> => ({
  request: {
    query: GetContractsListDocument,
    variables: { page, limit: DEFAULT_PAGE_SIZE, ...variables },
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

  it('renders contract data with enabled search and filters', async () => {
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
    expect(screen.getByPlaceholderText('Search contracts')).toBeEnabled()
    expect(screen.getByRole('button', { name: /filters/i })).toBeEnabled()
    expect(screen.getByText('Contracts')).toBeInTheDocument()

    const headers = screen.getAllByRole('columnheader')

    expect(headers.map((header) => header.textContent)).toEqual([
      'Status',
      'Name',
      'Customer name',
      'Start date',
      'End date',
      '',
    ])
    expect(headers[2]).toHaveStyle({ width: '100%' })
    expect(headers[1]).toHaveStyle({ width: 'auto' })

    const row = screen.getByTestId('table-row-0')
    const cells = within(row).getAllByRole('cell')

    expect(cells[0].firstElementChild).toHaveStyle({ minWidth: '80px' })
    expect(cells[1].firstElementChild).toHaveStyle({ minWidth: '200px' })
    expect(cells[2]).not.toHaveClass('max-w-0')
    expect(cells[2].firstElementChild).toHaveStyle({ minWidth: '200px' })
    expect(cells[3].firstElementChild).toHaveStyle({ minWidth: '140px' })
    expect(cells[4].firstElementChild).toHaveStyle({ minWidth: '140px' })
    expect(cells[5]).toHaveClass('sticky', 'right-0')

    expect(screen.getByTestId('table-contracts-list').parentElement).toHaveClass('overflow-auto')
  })

  it('resets pagination when search changes', async () => {
    window.history.replaceState({}, '', '/acme/contracts?page=2')
    render(
      <>
        <MainHeader />
        <ContractsPage />
      </>,
      { mocks: [contractsMock([contract], 2, 41)] },
    )

    await screen.findByText('Enterprise agreement')
    fireEvent.change(screen.getByPlaceholderText('Search contracts'), {
      target: { value: 'enterprise' },
    })

    expect(testMockNavigateFn).toHaveBeenCalledWith({ search: '' }, { replace: true })
  })

  it('sends URL filters to GraphQL and shows the criteria-aware empty state', async () => {
    const searchParams = new URLSearchParams({
      clf_contractAffiliatedEntityIds: 'entity-1|-_-|France,entity-2|-_-|Germany',
      clf_customerExternalId: 'customer-1|-_-|Acme',
      clf_externalId: 'contract-2026',
      clf_contractPlanCode: 'enterprise|-_-|Enterprise',
      clf_contractRateOverrides: 'false',
      clf_contractStatus: 'active,pending',
    })

    window.history.replaceState({}, '', `/acme/contracts?${searchParams.toString()}`)
    render(
      <>
        <MainHeader />
        <ContractsPage />
      </>,
      {
        mocks: [
          contractsMock([], 1, 0, {
            billingEntityIds: ['entity-1', 'entity-2'],
            externalCustomerId: 'customer-1',
            externalId: 'contract-2026',
            hasRateOverrides: false,
            planCode: 'enterprise',
            status: [ContractStatusEnum.Active, ContractStatusEnum.Pending],
          }),
        ],
      },
    )

    expect(await screen.findByText('There are no contracts')).toBeInTheDocument()
    expect(screen.getByText('Could you adjust your filters?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
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
    await waitFor(() =>
      expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument(),
    )
  })

  it('links rows to contract details and supports pointer and keyboard navigation', async () => {
    render(<ContractsPage />, { mocks: [contractsMock()] })

    const row = await screen.findByTestId('table-row-0')
    const link = within(row).getByRole('link', { name: 'Enterprise agreement' })

    expect(row).toHaveAttribute('tabindex', '0')
    expect(row).toHaveClass('cursor-pointer')
    expect(link).toHaveAttribute('href', '/contract/contract-1')

    fireEvent.click(row)
    expect(testMockNavigateFn).toHaveBeenCalledWith('/contract/contract-1')

    testMockNavigateFn.mockClear()
    row.focus()
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' })
    expect(testMockNavigateFn).toHaveBeenCalledWith('/contract/contract-1')
  })

  it('copies the external ID from the row action menu', async () => {
    render(<ContractsPage />, { mocks: [contractsMock()] })

    const row = await screen.findByTestId('table-row-0')

    fireEvent.click(within(row).getByTestId(OPEN_ACTION_BUTTON_TEST_ID))
    fireEvent.click(await screen.findByTestId('copy-contract-external-id'))

    expect(copyToClipboard).toHaveBeenCalledWith('enterprise-2026')
    expect(addToast).toHaveBeenCalledWith({
      severity: 'info',
      translateKey: 'text_1789636691484fyt51yyc9uh',
    })
  })

  it('shows a full page of skeleton rows while fetching, then the empty state', async () => {
    render(<ContractsPage />, { mocks: [{ ...contractsMock([], 1, 0), delay: 30 }] })

    expect(screen.getAllByRole('row')).toHaveLength(DEFAULT_PAGE_SIZE + 1)
    expect(screen.getByRole('button', { name: 'next page' })).toBeDisabled()
    expect(screen.queryByText('No contract yet')).not.toBeInTheDocument()

    expect(await screen.findByText('No contract yet')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument()
  })

  it('handles nullable contract names and dates', async () => {
    render(<ContractsPage />, {
      mocks: [contractsMock([{ ...contract, name: null, startedAt: null, endedAt: null }])],
    })

    expect(await screen.findByText('enterprise-2026')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(2)
  })

  it('reloads the page from the error state, like other lists', async () => {
    const failedMock = {
      request: contractsMock().request,
      error: new Error('Contracts temporarily unavailable'),
    }

    render(<ContractsPage />, { mocks: [failedMock] })

    const retry = await screen.findByRole('button', { name: /refresh/i })

    expect(retry).toHaveAttribute('data-test', 'generic-placeholder-button')
    fireEvent.click(retry)
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
