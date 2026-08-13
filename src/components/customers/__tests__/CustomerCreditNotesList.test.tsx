import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { CurrencyEnum, TimezoneEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { CustomerCreditNotesList } from '../CustomerCreditNotesList'

// --- Mocks ---

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useCustomerFilterDefaults', () => ({
  useCustomerFilterDefaults: () => null,
}))

const mockGetCreditNotes = jest.fn()
let mockQueryResult: {
  data: unknown
  loading: boolean
  error: unknown
  fetchMore: jest.Mock
  variables: Record<string, unknown>
} = {
  data: null,
  loading: false,
  error: null,
  fetchMore: jest.fn(),
  variables: {},
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCustomerCreditNotesLazyQuery: jest.fn(() => [mockGetCreditNotes, mockQueryResult]),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}))

jest.mock('~/components/Filters/graphql/utils', () => ({
  formatFiltersForCustomerCreditNotesQuery: () => ({
    currency: undefined,
    billingEntityId: undefined,
  }),
}))

// Mock child components to isolate unit tests
jest.mock('~/components/customers/CustomerCreditNotesBreakdown', () => ({
  CustomerCreditNotesBreakdown: () => <div data-test="mock-credit-notes-breakdown">Breakdown</div>,
}))

jest.mock('~/components/creditNote/CreditNotesTable', () => ({
  __esModule: true,
  default: () => <div data-test="mock-credit-notes-table">Table</div>,
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: ({ onChange }: { onChange: (v: string) => void }) => (
    <input data-test="mock-search-input" onChange={(e) => onChange(e.target.value)} />
  ),
}))

jest.mock('~/public/images/maneki/error.svg', () => {
  const ErrorSvg = () => <svg data-test="error-svg" />

  ErrorSvg.displayName = 'ErrorSvg'

  return ErrorSvg
})

// --- Helpers ---

const defaultProps = {
  customerId: 'cust-1',
  customerBillingEntity: { id: 'be-1', code: 'code-1', name: 'Entity One' },
  creditNotesBalances: [],
  userCurrency: CurrencyEnum.Eur,
  customerTimezone: TimezoneEnum.TzUtc,
}

const renderComponent = (overrides = {}) =>
  render(<CustomerCreditNotesList {...defaultProps} {...overrides} />)

// --- Tests ---

describe('CustomerCreditNotesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockQueryResult = {
      data: null,
      loading: false,
      error: null,
      fetchMore: jest.fn(),
      variables: {},
    }
  })

  describe('GIVEN the component renders', () => {
    describe('WHEN the balances section is displayed', () => {
      it('THEN should render CustomerCreditNotesBreakdown', () => {
        renderComponent()

        expect(screen.getByTestId('mock-credit-notes-breakdown')).toBeInTheDocument()
      })

      it('THEN should call the lazy query on mount', () => {
        renderComponent()

        expect(mockGetCreditNotes).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the query returns an error', () => {
    describe('WHEN the component renders', () => {
      it('THEN should show the error placeholder', () => {
        mockQueryResult = {
          ...mockQueryResult,
          error: new Error('Network error'),
          loading: false,
        }

        renderComponent()

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId('mock-credit-notes-table')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the query is loading', () => {
    describe('WHEN there is also an error', () => {
      it('THEN should NOT show the error placeholder (loading takes precedence)', () => {
        mockQueryResult = {
          ...mockQueryResult,
          error: new Error('Network error'),
          loading: true,
        }

        renderComponent()

        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId('mock-credit-notes-table')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the search input', () => {
    describe('WHEN the user types a search term', () => {
      it('THEN should trigger the lazy query with the debounced search term', async () => {
        jest.useFakeTimers()

        renderComponent()

        const searchInput = screen.getByTestId('mock-search-input') as HTMLInputElement

        await userEvent
          .setup({ advanceTimers: jest.advanceTimersByTime })
          .type(searchInput, 'test-search')

        // Advance past the debounce delay
        act(() => {
          jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
          expect(mockGetCreditNotes).toHaveBeenCalled()
        })

        jest.useRealTimers()
      })
    })
  })
})
