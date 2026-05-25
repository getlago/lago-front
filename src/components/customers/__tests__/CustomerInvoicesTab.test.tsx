import { screen } from '@testing-library/react'

import { CurrencyEnum, TimezoneEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  CustomerInvoicesTab,
  INVOICES_TAB_CONTAINER,
  INVOICES_TAB_DRAFT_SECTION,
  INVOICES_TAB_FINALIZED_SECTION,
  INVOICES_TAB_SEE_MORE,
} from '../CustomerInvoicesTab'

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

jest.mock('~/components/designSystem/Filters/utils', () => ({
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

const mockGetDraftInvoices = jest.fn()
const mockGetFinalizedInvoices = jest.fn()

let mockDraftResult: {
  data: { customerInvoices: { metadata: { totalCount: number } } } | null
  loading: boolean
  error: unknown
}
let mockFinalizedResult: {
  data: unknown
  loading: boolean
  error: unknown
  fetchMore: jest.Mock
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerInvoicesLazyQuery: jest.fn(),
}))

// We need to dynamically return different values for the two calls
const { useGetCustomerInvoicesLazyQuery } = jest.requireMock('~/generated/graphql') as {
  useGetCustomerInvoicesLazyQuery: jest.Mock
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

const setupMocks = (draftTotalCount = 0) => {
  mockDraftResult = {
    data: {
      customerInvoices: {
        metadata: { totalCount: draftTotalCount },
      },
    },
    loading: false,
    error: null,
  }
  mockFinalizedResult = {
    data: null,
    loading: false,
    error: null,
    fetchMore: jest.fn(),
  }

  // The hook is called twice: first for draft, second for finalized
  useGetCustomerInvoicesLazyQuery
    .mockReturnValueOnce([mockGetDraftInvoices, mockDraftResult])
    .mockReturnValueOnce([mockGetFinalizedInvoices, mockFinalizedResult])
}

const renderComponent = (overrides = {}) =>
  render(<CustomerInvoicesTab {...defaultProps} {...overrides} />)

// --- Tests ---

describe('CustomerInvoicesTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  describe('GIVEN draft invoice count exceeds the display limit', () => {
    describe('WHEN there are more than 4 draft invoices', () => {
      it('THEN should show the "See More" button', () => {
        setupMocks(5)

        renderComponent()

        expect(screen.getByTestId(INVOICES_TAB_SEE_MORE)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN draft invoice count is within the display limit', () => {
    describe.each([
      { count: 0, label: '0 drafts' },
      { count: 3, label: '3 drafts' },
      { count: 4, label: '4 drafts (exact limit)' },
    ])('WHEN there are $label', ({ count }) => {
      it('THEN should NOT show the "See More" button', () => {
        setupMocks(count)

        renderComponent()

        expect(screen.queryByTestId(INVOICES_TAB_SEE_MORE)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN both multi_currency and multi_entity_billing flags are enabled', () => {
    describe('WHEN the component renders as non-partner', () => {
      it('THEN should render the overview section', () => {
        setupMocks()

        renderComponent({ isPartner: false })

        expect(screen.getByTestId('mock-customer-overview')).toBeInTheDocument()
      })

      it('THEN should render both draft and finalized sections with filters', () => {
        setupMocks()

        renderComponent({ isPartner: false })

        expect(screen.getByTestId(INVOICES_TAB_DRAFT_SECTION)).toBeInTheDocument()
        expect(screen.getByTestId(INVOICES_TAB_FINALIZED_SECTION)).toBeInTheDocument()
      })

      it('THEN should call both draft and finalized query functions', () => {
        setupMocks()

        renderComponent({ isPartner: false })

        expect(mockGetDraftInvoices).toHaveBeenCalled()
        expect(mockGetFinalizedInvoices).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the tab renders', () => {
    describe('WHEN the component mounts', () => {
      it('THEN should render both draft and finalized sections', () => {
        setupMocks()

        renderComponent()

        expect(screen.getByTestId(INVOICES_TAB_DRAFT_SECTION)).toBeInTheDocument()
        expect(screen.getByTestId(INVOICES_TAB_FINALIZED_SECTION)).toBeInTheDocument()
      })

      it('THEN should render the container', () => {
        setupMocks()

        renderComponent()

        expect(screen.getByTestId(INVOICES_TAB_CONTAINER)).toBeInTheDocument()
      })
    })
  })
})
