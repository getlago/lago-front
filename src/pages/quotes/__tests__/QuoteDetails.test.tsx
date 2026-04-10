import { render, testMockNavigateFn } from '~/test-utils'

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

describe('QuoteDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({ quoteId: 'quote-draft-001' })
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

        expect(config.tabs[1].title).toBe('text_17757461968258p4ij8g74zp')
        expect(config.tabs[1].link).toBe('/quote/quote-draft-001/order-forms')
      })

      it('THEN should have Activity logs as the third tab', () => {
        render(<QuoteDetails />)

        const config = mockMainHeaderConfigure.mock.calls[0][0]

        expect(config.tabs[2].title).toBe('text_1747314141347qq6rasuxisl')
        expect(config.tabs[2].link).toBe('/quote/quote-draft-001/activity-logs')
      })
    })
  })

  describe('GIVEN the page is rendered with an invalid quote', () => {
    it('THEN should redirect to quotes list', () => {
      const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

      useParamsMock.mockReturnValue({ quoteId: 'non-existent-id' })

      render(<QuoteDetails />)

      expect(testMockNavigateFn).toHaveBeenCalledWith('/quotes', { replace: true })
    })
  })
})
