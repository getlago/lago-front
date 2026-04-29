import { screen } from '@testing-library/react'

import { OrderTypeEnum, QuoteDetailItemFragment, StatusEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useQuoteVersionActions } from '../hooks/useQuoteVersionActions'
import QuoteDetailsVersions, { QUOTE_VERSIONS_TABLE_TEST_ID } from '../QuoteDetailsVersions'

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

const mockGetActions = jest.fn()

jest.mock('../hooks/useQuoteVersionActions', () => ({
  useQuoteVersionActions: jest.fn(),
}))

const mockUseQuoteVersionActions = useQuoteVersionActions as jest.MockedFunction<
  typeof useQuoteVersionActions
>

const mockQuote: QuoteDetailItemFragment = {
  id: 'quote-v2',
  number: 'QT-2026-0042',
  versions: [
    { id: 'version-v2', status: StatusEnum.Draft, version: 2, createdAt: '2026-04-09T15:00:00Z' },
    {
      id: 'version-v1',
      status: StatusEnum.Approved,
      version: 1,
      createdAt: '2026-04-01T10:00:00Z',
    },
  ],
  orderType: OrderTypeEnum.SubscriptionAmendment,
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
    mockGetActions.mockReturnValue([])
    mockUseQuoteVersionActions.mockReturnValue({ getActions: mockGetActions })
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

  describe('GIVEN the version action column', () => {
    describe('WHEN a version has actions available', () => {
      it('THEN should call getActions with the quote and each version', () => {
        mockGetActions.mockReturnValue([{ icon: 'pen', label: 'Edit', onAction: jest.fn() }])

        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(mockGetActions).toHaveBeenCalledWith(
          mockQuote,
          expect.objectContaining({ id: 'version-v2' }),
        )
        expect(mockGetActions).toHaveBeenCalledWith(
          mockQuote,
          expect.objectContaining({ id: 'version-v1' }),
        )
      })
    })

    describe('WHEN a version has no actions', () => {
      it('THEN should render without action buttons', () => {
        mockGetActions.mockReturnValue([])

        render(<QuoteDetailsVersions quote={mockQuote} />)

        expect(screen.queryByTestId('table-row-0-action-button')).not.toBeInTheDocument()
      })
    })
  })
})
