import { screen } from '@testing-library/react'

import { OrderTypeEnum, StatusEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import { useQuote } from '../hooks/useQuote'
import { useQuoteVersionActions } from '../hooks/useQuoteVersionActions'
import QuoteDetails, { QUOTE_DETAILS_CUSTOMER_LINK_TEST_ID } from '../QuoteDetails'

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

jest.mock('../OrderFormsList', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../OrdersList', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../QuoteDetailsActivityLogs', () => ({
  __esModule: true,
  default: () => null,
}))

const mockHasPermissions = jest.fn()
const mockIsPremium = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium() }),
}))

const mockQuote = {
  id: 'quote-draft-001',
  number: 'QT-2026-0042',
  images: {},
  orderType: OrderTypeEnum.SubscriptionCreation,
  createdAt: '2026-04-09T10:00:00Z',
  orderForms: [],
  versions: [
    { id: 'version-1', status: StatusEnum.Draft, version: 1, createdAt: '2026-04-09T10:00:00Z' },
  ],
  currentVersion: {
    id: 'version-1',
    status: StatusEnum.Draft,
    version: 1,
    content: null,
    currency: null,
    billingEntityId: null,
    billingItems: null,
    createdAt: '2026-04-09T10:00:00Z',
    mentionVariables: {},
  },
  customer: {
    id: 'customer-001',
    name: 'Acme Corp',
    displayName: 'Acme Corp',
    externalId: 'ext-acme-001',
    currency: null,
    netPaymentTerm: null,
    billingEntity: {
      id: 'be-1',
      code: 'default',
      name: 'Default Entity',
      netPaymentTerm: 0,
    },
  },
}

jest.mock('../hooks/useQuote', () => ({
  useQuote: jest.fn(),
}))

jest.mock('../hooks/useQuoteVersionActions', () => ({
  useQuoteVersionActions: jest.fn(),
}))

const mockUseQuote = useQuote as jest.MockedFunction<typeof useQuote>
const mockUseQuoteVersionActions = useQuoteVersionActions as jest.MockedFunction<
  typeof useQuoteVersionActions
>

describe('QuoteDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium.mockReturnValue(true)
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ quoteId: 'quote-draft-001' })

    mockUseQuote.mockReturnValue({
      quote: mockQuote,
      loading: false,
      error: undefined,
      refetch: jest.fn(),
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

        render(<>{config.entity.metadata}</>)

        const link = screen.getByTestId(QUOTE_DETAILS_CUSTOMER_LINK_TEST_ID)

        expect(link).toHaveTextContent('Acme Corp')
        expect(link).toHaveTextContent('ext-acme-001')
      })

      it('THEN should link the customer metadata to the customer detail page', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        render(<>{config.entity.metadata}</>)

        expect(screen.getByTestId(QUOTE_DETAILS_CUSTOMER_LINK_TEST_ID)).toHaveAttribute(
          'href',
          expect.stringContaining('/customer/customer-001'),
        )
      })

      it('THEN should fall back to empty metadata while the quote is loading', () => {
        mockUseQuote.mockReturnValue({
          quote: undefined,
          loading: true,
          error: undefined,
          refetch: jest.fn(),
        })

        render(<QuoteDetails />)

        expect(mockMainHeaderConfigure.mock.calls[0][0].entity.metadata).toBe('')
      })

      it('THEN should configure MainHeader with four tabs', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs).toHaveLength(4)
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

      it('THEN should have Orders as the third tab', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs[2].link).toBe('/quote/quote-draft-001/orders')
      })

      it('THEN should have Activity logs as the fourth tab', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs[3].link).toBe('/quote/quote-draft-001/activity-logs')
      })

      it('THEN should show the activity logs tab', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs[3].hidden).toBe(false)
      })
    })

    describe('WHEN the user lacks the orderFormsView permission', () => {
      it('THEN should hide the order forms tab', () => {
        mockHasPermissions.mockReturnValue(false)

        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs).toHaveLength(3)
        expect(
          config.tabs.some((tab: { link?: string }) => tab.link?.endsWith('/order-forms')),
        ).toBe(false)
      })
    })

    describe.each([
      ['the user is not premium', { isPremium: false, hasPermissions: true }],
      ['the user lacks the auditLogsView permission', { isPremium: true, hasPermissions: false }],
    ])('WHEN %s', (_, { isPremium, hasPermissions }) => {
      it('THEN should hide the activity logs tab', () => {
        mockIsPremium.mockReturnValue(isPremium)
        mockHasPermissions.mockReturnValue(hasPermissions)

        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]
        const activityLogsTab = config.tabs.find((tab: { link?: string }) =>
          tab.link?.endsWith('/activity-logs'),
        )

        expect(activityLogsTab.hidden).toBe(true)
      })
    })

    describe('WHEN loading', () => {
      it('THEN should set viewNameLoading to true', () => {
        mockUseQuote.mockReturnValue({
          quote: undefined,
          loading: true,
          error: undefined,
          refetch: jest.fn(),
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

      it('THEN should call onAction and closePopper when dropdown item is clicked', () => {
        const mockOnAction = jest.fn()
        const mockClosePopper = jest.fn()

        mockUseQuoteVersionActions.mockReturnValue({
          getActions: jest
            .fn()
            .mockReturnValue([
              { icon: 'validate-unfilled', label: 'Approve', onAction: mockOnAction },
            ]),
        })

        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]
        const dropdownItem = config.actions.items[0].items[0]

        dropdownItem.onClick(mockClosePopper)

        expect(mockOnAction).toHaveBeenCalled()
        expect(mockClosePopper).toHaveBeenCalled()
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

    describe('WHEN the quote is not loaded yet', () => {
      it('THEN should pass empty actions items', () => {
        mockUseQuote.mockReturnValue({
          quote: undefined,
          loading: true,
          error: undefined,
          refetch: jest.fn(),
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
        refetch: jest.fn(),
      })

      const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

      useParamsMock.mockReturnValue({ quoteId: 'non-existent-id' })

      render(<QuoteDetails />)

      expect(testMockNavigateFn).toHaveBeenCalledWith('/quotes', { replace: true })
    })
  })
})
