import { screen } from '@testing-library/react'

import { OrderTypeEnum, QuoteDetailItemFragment, StatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useQuotes } from '../hooks/useQuotes'
import QuoteDetailsVersions, { QUOTE_VERSIONS_TABLE_TEST_ID } from '../QuoteDetailsVersions'

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

const mockVersions = [
  {
    id: 'quote-v2',
    number: 'QT-2026-0042',
    status: StatusEnum.Draft,
    version: 2,
    orderType: OrderTypeEnum.SubscriptionAmendment,
    currency: 'EUR',
    createdAt: '2026-04-09T15:00:00Z',
    customer: { id: 'customer-001', name: 'Acme Corp' },
  },
  {
    id: 'quote-v1',
    number: 'QT-2026-0042',
    status: StatusEnum.Approved,
    version: 1,
    orderType: OrderTypeEnum.SubscriptionCreation,
    currency: 'EUR',
    createdAt: '2026-04-01T10:00:00Z',
    customer: { id: 'customer-001', name: 'Acme Corp' },
  },
]

const mockQuote: QuoteDetailItemFragment = {
  id: 'quote-v2',
  number: 'QT-2026-0042',
  status: StatusEnum.Draft,
  version: 2,
  orderType: OrderTypeEnum.SubscriptionAmendment,
  currency: 'EUR',
  createdAt: '2026-04-09T15:00:00Z',
  customer: {
    id: 'customer-001',
    name: 'Acme Corp',
    externalId: 'ext-acme-001',
  },
  owners: [
    { id: 'user-1', email: 'alice@example.com' },
    { id: 'user-2', email: 'bob@example.com' },
  ],
}

describe('QuoteDetailsVersions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseQuotes.mockReturnValue({
      quotes: mockVersions,
      loading: false,
      error: undefined,
      fetchMore: jest.fn(),
      metadata: { currentPage: 1, totalPages: 1, totalCount: 2 },
    })
  })

  describe('GIVEN the component is rendered with a quote', () => {
    describe('WHEN displaying quote details', () => {
      it('THEN should render the versions section', () => {
        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(screen.getByTestId(QUOTE_VERSIONS_TABLE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the quote number', () => {
        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(screen.getByText('QT-2026-0042')).toBeInTheDocument()
      })

      it('THEN should display the customer name and external id', () => {
        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(screen.getByText('Acme Corp - ext-acme-001')).toBeInTheDocument()
      })

      it('THEN should display owner emails as chips', () => {
        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(screen.getByText('alice@example.com')).toBeInTheDocument()
        expect(screen.getByText('bob@example.com')).toBeInTheDocument()
      })
    })

    describe('WHEN the quote has no owners', () => {
      it('THEN should not display the owners section', () => {
        const quoteWithoutOwners = { ...mockQuote, owners: [] }

        render(<QuoteDetailsVersions quote={quoteWithoutOwners} />)

        expect(screen.getByTestId(QUOTE_VERSIONS_TABLE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument()
        expect(screen.queryByText('bob@example.com')).not.toBeInTheDocument()
      })
    })

    describe('WHEN displaying the versions table', () => {
      it('THEN should call useQuotes with the quote number', () => {
        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(mockUseQuotes).toHaveBeenCalledWith(
          expect.objectContaining({ number: ['QT-2026-0042'] }),
        )
      })

      it('THEN should render version rows', () => {
        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(screen.getByTestId('table-row-0')).toBeInTheDocument()
        expect(screen.getByTestId('table-row-1')).toBeInTheDocument()
      })

      it('THEN should display version numbers with quote number', () => {
        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(screen.getByText('QT-2026-0042 - v2')).toBeInTheDocument()
        expect(screen.getByText('QT-2026-0042 - v1')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the versions are loading', () => {
    it('THEN should pass loading to the table', () => {
      mockUseQuotes.mockReturnValue({
        quotes: [],
        loading: true,
        error: undefined,
        fetchMore: jest.fn(),
        metadata: undefined,
      })

      render(<QuoteDetailsVersions quote={mockQuote} />)

      expect(screen.getByTestId('table-quote-versions')).toBeInTheDocument()
    })
  })
})
