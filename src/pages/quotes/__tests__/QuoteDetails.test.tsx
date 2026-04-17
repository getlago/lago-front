import { OrderTypeEnum, StatusEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import { useQuote } from '../hooks/useQuote'
import { useQuotes } from '../hooks/useQuotes'
import { useQuoteVersionActions } from '../hooks/useQuoteVersionActions'
import QuoteDetails from '../QuoteDetails'

const mockMainHeaderConfigure = jest.fn()

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: (props: Record<string, unknown>) => {
      mockMainHeaderConfigure(props)
      return null
    },
  },
}))

jest.mock('~/components/MainHeader/useMainHeaderTabContent', () => ({
  useMainHeaderTabContent: () => null,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) => {
      if (vars) return `${key}:${JSON.stringify(vars)}`
      return key
    },
  }),
}))

jest.mock('../QuoteDetailsVersions', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../QuoteDetailsActivityLogs', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../OrderFormsList', () => ({
  __esModule: true,
  default: () => null,
}))

const mockQuote = {
  id: 'quote-draft-001',
  number: 'QT-2026-0042',
  status: StatusEnum.Draft,
  version: 1,
  orderType: OrderTypeEnum.SubscriptionCreation,
  currency: 'EUR',
  createdAt: '2026-04-09T10:00:00Z',
  customer: {
    id: 'customer-001',
    name: 'Acme Corp',
    externalId: 'ext-acme-001',
  },
}

jest.mock('../hooks/useQuote', () => ({
  useQuote: jest.fn(),
}))

jest.mock('../hooks/useQuotes', () => ({
  useQuotes: jest.fn(),
}))

jest.mock('../hooks/useQuoteVersionActions', () => ({
  useQuoteVersionActions: jest.fn(),
}))

const mockUseQuote = useQuote as jest.MockedFunction<typeof useQuote>
const mockUseQuotes = useQuotes as jest.MockedFunction<typeof useQuotes>
const mockUseQuoteVersionActions = useQuoteVersionActions as jest.MockedFunction<
  typeof useQuoteVersionActions
>

describe('QuoteDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ quoteId: 'quote-draft-001' })

    mockUseQuote.mockReturnValue({
      quote: mockQuote,
      loading: false,
      error: undefined,
    })

    mockUseQuotes.mockReturnValue({
      quotes: [mockQuote],
      loading: false,
      error: undefined,
      fetchMore: jest.fn(),
      metadata: { currentPage: 1, totalPages: 1, totalCount: 1 },
    })

    mockUseQuoteVersionActions.mockReturnValue({
      getActions: jest.fn().mockReturnValue([
        { icon: 'validate-unfilled', label: 'Approve', onAction: jest.fn() },
        { icon: 'pen', label: 'Edit', onAction: jest.fn() },
      ]),
    })
  })

  describe('GIVEN the page is rendered with a valid quote', () => {
    describe('WHEN in default state', () => {
      it('THEN should configure MainHeader with breadcrumb back to quotes list', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.breadcrumb).toHaveLength(1)
        expect(config.breadcrumb[0].path).toBe('/quotes/quotes')
      })

      it('THEN should configure MainHeader with entity viewName as quote number', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.entity.viewName).toBe('QT-2026-0042')
      })

      it('THEN should configure MainHeader with metadata showing customer info', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.entity.metadata).toContain('Acme Corp')
        expect(config.entity.metadata).toContain('ext-acme-001')
      })

      it('THEN should configure MainHeader with three tabs', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs).toHaveLength(3)
      })

      it('THEN should have the first tab linking to overview', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs[0].link).toBe('/quote/quote-draft-001/overview')
      })

      it('THEN should have Order forms as the second tab', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs[1].link).toBe('/quote/quote-draft-001/order-forms')
      })

      it('THEN should have Activity logs as the third tab', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs[2].link).toBe('/quote/quote-draft-001/activity-logs')
      })
    })

    describe('WHEN loading', () => {
      it('THEN should set viewNameLoading to true', () => {
        mockUseQuote.mockReturnValue({
          quote: undefined,
          loading: true,
          error: undefined,
        })

        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.entity.viewNameLoading).toBe(true)
        expect(config.entity.metadataLoading).toBe(true)
      })
    })
  })

  describe('GIVEN the page is rendered with header actions', () => {
    describe('WHEN the latest version has actions', () => {
      it('THEN should pass actions to MainHeader.Configure', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.actions).toBeDefined()
        expect(config.actions.items).toHaveLength(1)
        expect(config.actions.items[0].type).toBe('dropdown')
      })

      it('THEN should pass dropdown items mapped from getActions', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]
        const dropdownItems = config.actions.items[0].items

        expect(dropdownItems).toHaveLength(2)
        expect(dropdownItems[0].startIcon).toBe('validate-unfilled')
        expect(dropdownItems[1].startIcon).toBe('pen')
      })
    })

    describe('WHEN the latest version has no actions', () => {
      it('THEN should pass empty actions items', () => {
        mockUseQuoteVersionActions.mockReturnValue({
          getActions: jest.fn().mockReturnValue([]),
        })

        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.actions.items).toHaveLength(0)
      })
    })

    describe('WHEN there are no versions loaded yet', () => {
      it('THEN should pass empty actions items', () => {
        mockUseQuotes.mockReturnValue({
          quotes: [],
          loading: true,
          error: undefined,
          fetchMore: jest.fn(),
          metadata: undefined,
        })

        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.actions.items).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the page is rendered with an invalid quote', () => {
    it('THEN should redirect to quotes list', () => {
      mockUseQuote.mockReturnValue({
        quote: undefined,
        loading: false,
        error: undefined,
      })

      const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

      useParamsMock.mockReturnValue({ quoteId: 'non-existent-id' })

      render(<QuoteDetails />)

      expect(testMockNavigateFn).toHaveBeenCalledWith('/quotes', { replace: true })
    })
  })
})
