import { screen } from '@testing-library/react'

import { OrderTypeEnum, StatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useQuotes } from '../hooks/useQuotes'
import QuotesList from '../QuotesList'

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})

globalThis.IntersectionObserver = mockIntersectionObserver

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (date: string) => ({
      date: new Date(date).toLocaleDateString('en-US'),
    }),
  }),
}))

jest.mock('../hooks/useQuotes', () => ({
  useQuotes: jest.fn(),
}))

const mockUseQuotes = useQuotes as jest.MockedFunction<typeof useQuotes>

const mockQuotes = [
  {
    id: 'quote-1',
    number: 'QT-2026-0042',
    status: StatusEnum.Draft,
    version: 2,
    orderType: OrderTypeEnum.SubscriptionAmendment,
    currency: 'EUR',
    createdAt: '2026-04-09T15:00:00Z',
    customer: { id: 'customer-001', name: 'Acme Corp' },
  },
  {
    id: 'quote-2',
    number: 'QT-2026-0038',
    status: StatusEnum.Approved,
    version: 2,
    orderType: OrderTypeEnum.SubscriptionCreation,
    currency: 'USD',
    createdAt: '2026-04-01T09:00:00Z',
    customer: { id: 'customer-002', name: 'Globex Inc' },
  },
  {
    id: 'quote-3',
    number: 'QT-2026-0015',
    status: StatusEnum.Voided,
    version: 1,
    orderType: OrderTypeEnum.OneOff,
    currency: 'EUR',
    createdAt: '2026-03-10T08:00:00Z',
    customer: { id: 'customer-003', name: 'Wayne Enterprises' },
  },
]

describe('QuotesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuotes.mockReturnValue({
      quotes: mockQuotes,
      loading: false,
      error: undefined,
      fetchMore: jest.fn(),
      metadata: { currentPage: 1, totalPages: 1, totalCount: 3 },
    })
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN quotes are loaded', () => {
      it('THEN should call useQuotes with latestVersionOnly', () => {
        render(<QuotesList />)

        expect(mockUseQuotes).toHaveBeenCalledWith(
          expect.objectContaining({ latestVersionOnly: true }),
        )
      })

      it('THEN should render the quotes table with rows', () => {
        render(<QuotesList />)

        expect(screen.getByTestId('table-row-0')).toBeInTheDocument()
        expect(screen.getByTestId('table-row-1')).toBeInTheDocument()
        expect(screen.getByTestId('table-row-2')).toBeInTheDocument()
      })

      it('THEN should display quote numbers', () => {
        render(<QuotesList />)

        expect(screen.getByText('QT-2026-0042')).toBeInTheDocument()
        expect(screen.getByText('QT-2026-0038')).toBeInTheDocument()
        expect(screen.getByText('QT-2026-0015')).toBeInTheDocument()
      })

      it('THEN should display customer names', () => {
        render(<QuotesList />)

        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        expect(screen.getByText('Globex Inc')).toBeInTheDocument()
        expect(screen.getByText('Wayne Enterprises')).toBeInTheDocument()
      })

      it('THEN should display status badges', () => {
        render(<QuotesList />)

        const statusBadges = screen.getAllByTestId('status')

        expect(statusBadges.length).toBeGreaterThan(0)
      })

      it('THEN should display version numbers', () => {
        render(<QuotesList />)

        expect(screen.getAllByText('2').length).toBeGreaterThan(0)
        expect(screen.getAllByText('1').length).toBeGreaterThan(0)
      })
    })

    describe('WHEN quotes are loading', () => {
      it('THEN should show the table in loading state', () => {
        mockUseQuotes.mockReturnValue({
          quotes: [],
          loading: true,
          error: undefined,
          fetchMore: jest.fn(),
          metadata: undefined,
        })

        render(<QuotesList />)

        expect(screen.getByTestId('table-quotes-list')).toBeInTheDocument()
      })
    })

    describe('WHEN there are no quotes', () => {
      it('THEN should show empty state', () => {
        mockUseQuotes.mockReturnValue({
          quotes: [],
          loading: false,
          error: undefined,
          fetchMore: jest.fn(),
          metadata: undefined,
        })

        render(<QuotesList />)

        expect(screen.queryByTestId('table-row-0')).not.toBeInTheDocument()
      })
    })
  })
})
