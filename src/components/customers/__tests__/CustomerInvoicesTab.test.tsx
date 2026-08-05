import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum, InvoiceStatusTypeEnum, TimezoneEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { CustomerInvoicesTab, INVOICES_TAB_CONTAINER } from '../CustomerInvoicesTab'

// --- Mocks ---

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useCustomerFilterDefaults', () => ({
  useCustomerFilterDefaults: () => null,
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}))

const mockGoToPage = jest.fn()

jest.mock('~/components/designSystem/Pagination', () => ({
  usePageSearchParam: jest.fn(() => ({ page: 1, goToPage: mockGoToPage })),
}))

jest.mock('~/components/Filters/graphql/utils', () => ({
  formatFiltersForCustomerInvoicesQuery: () => ({
    currency: undefined,
    billingEntityId: undefined,
  }),
}))

// Mock child components
jest.mock('~/components/customers/overview/CustomerOverview', () => ({
  CustomerOverview: () => <div data-test="mock-customer-overview">Overview</div>,
}))

jest.mock('~/components/customers/CustomerInvoicesList', () => ({
  CustomerInvoicesList: () => <div data-test="mock-invoices-list">InvoicesList</div>,
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: ({ onChange }: { onChange: (v: string) => void }) => (
    <input data-test="mock-search-input" onChange={(e) => onChange(e.target.value)} />
  ),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerInvoicesQuery: jest.fn(),
}))

const { useGetCustomerInvoicesQuery } = jest.requireMock('~/generated/graphql') as {
  useGetCustomerInvoicesQuery: jest.Mock
}

const { usePageSearchParam } = jest.requireMock('~/components/designSystem/Pagination') as {
  usePageSearchParam: jest.Mock
}

// --- Helpers ---

const defaultProps = {
  customerId: 'cust-1',
  customerTimezone: TimezoneEnum.TzUtc,
  customerBillingEntity: { id: 'be-1', code: 'code-1', name: 'Entity One' },
  externalId: 'ext-1',
  userCurrency: CurrencyEnum.Eur,
  isPartner: false,
}

const setupMocks = () => {
  useGetCustomerInvoicesQuery.mockReturnValue({
    data: {
      customerInvoices: {
        collection: [],
        metadata: { currentPage: 1, totalCount: 0, totalPages: 1 },
      },
    },
    loading: false,
    error: null,
  })
}

const renderComponent = (overrides = {}) =>
  render(<CustomerInvoicesTab {...defaultProps} {...overrides} />)

// --- Tests ---

describe('CustomerInvoicesTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePageSearchParam.mockReturnValue({ page: 1, goToPage: mockGoToPage })
  })

  describe('GIVEN the user is not a partner', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the CustomerOverview section', () => {
        setupMocks()

        renderComponent({ isPartner: false })

        expect(screen.getByTestId('mock-customer-overview')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user is a partner', () => {
    describe('WHEN the component renders', () => {
      it('THEN should NOT render the CustomerOverview section', () => {
        setupMocks()

        renderComponent({ isPartner: true })

        expect(screen.queryByTestId('mock-customer-overview')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the merged invoices list', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the container', () => {
        setupMocks()

        renderComponent()

        expect(screen.getByTestId(INVOICES_TAB_CONTAINER)).toBeInTheDocument()
      })

      it('THEN should render a single invoices list', () => {
        setupMocks()

        renderComponent()

        expect(screen.getAllByTestId('mock-invoices-list')).toHaveLength(1)
      })

      it('THEN should render a single search input', () => {
        setupMocks()

        renderComponent()

        expect(screen.getAllByTestId('mock-search-input')).toHaveLength(1)
      })

      it('THEN should query invoices once with the merged status union and standard pagination', () => {
        setupMocks()

        renderComponent()

        expect(useGetCustomerInvoicesQuery).toHaveBeenCalledTimes(1)
        expect(useGetCustomerInvoicesQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            fetchPolicy: 'network-only',
            notifyOnNetworkStatusChange: true,
            variables: expect.objectContaining({
              customerId: 'cust-1',
              limit: 10,
              page: 1,
              status: [
                InvoiceStatusTypeEnum.Draft,
                InvoiceStatusTypeEnum.Finalized,
                InvoiceStatusTypeEnum.Voided,
                InvoiceStatusTypeEnum.Failed,
                InvoiceStatusTypeEnum.Pending,
              ],
            }),
          }),
        )
      })

      it('THEN should read the page from the un-prefixed page search param', () => {
        setupMocks()

        renderComponent()

        expect(usePageSearchParam).toHaveBeenCalledWith()
      })
    })

    describe('WHEN the URL points to a later page', () => {
      it('THEN should query that page', () => {
        setupMocks()
        usePageSearchParam.mockReturnValue({ page: 3, goToPage: mockGoToPage })

        renderComponent()

        expect(useGetCustomerInvoicesQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.objectContaining({ page: 3 }),
          }),
        )
      })
    })

    describe('WHEN the user types in the search input', () => {
      it('THEN should reset pagination to page 1', async () => {
        setupMocks()
        const user = userEvent.setup()

        renderComponent()

        await user.type(screen.getByTestId('mock-search-input'), 'inv')

        expect(mockGoToPage).toHaveBeenCalledWith(1)
      })
    })
  })
})
