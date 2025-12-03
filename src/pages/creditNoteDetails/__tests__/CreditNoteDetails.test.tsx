import { act, cleanup, screen } from '@testing-library/react'

import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import CreditNoteDetails from '../CreditNoteDetails'

const mockDownloadCreditNote = jest.fn()
const mockDownloadCreditNoteXml = jest.fn()
const mockGoBack = jest.fn()

jest.mock('../common/useDownloadCreditNote', () => ({
  useDownloadCreditNote: () => ({
    downloadCreditNote: mockDownloadCreditNote,
    loadingCreditNoteDownload: false,
    downloadCreditNoteXml: mockDownloadCreditNoteXml,
    loadingCreditNoteXmlDownload: false,
  }),
}))

const mockCreditNoteData = {
  creditNote: {
    id: 'credit-note-123',
    number: 'CN-001',
    canBeVoided: true,
    totalAmountCents: '10000',
    currency: CurrencyEnum.Usd,
    integrationSyncable: false,
    taxProviderSyncable: false,
    externalIntegrationId: null,
    taxProviderId: null,
    xmlUrl: null,
    refundStatus: null,
    metadata: [{ key: 'test_key', value: 'test_value' }],
    billingEntity: {
      einvoicing: false,
    },
    customer: {
      id: 'customer-123',
      netsuiteCustomer: null,
      xeroCustomer: null,
      anrokCustomer: null,
      avalaraCustomer: null,
    },
  },
}

const mockUseGetCreditNoteForDetailsQuery = jest.fn()
const mockUseSyncIntegrationCreditNoteMutation = jest.fn()
const mockUseRetryTaxReportingMutation = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCreditNoteForDetailsQuery: () => mockUseGetCreditNoteForDetailsQuery(),
  useSyncIntegrationCreditNoteMutation: () => mockUseSyncIntegrationCreditNoteMutation(),
  useRetryTaxReportingMutation: () => mockUseRetryTaxReportingMutation(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: jest.fn().mockReturnValue(true),
  }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({
    goBack: mockGoBack,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
  envGlobalVar: () => ({
    disablePdfGeneration: false,
  }),
}))

describe('CreditNoteDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({
      customerId: 'customer-123',
      invoiceId: 'invoice-123',
      creditNoteId: 'credit-note-123',
    })

    mockUseGetCreditNoteForDetailsQuery.mockReturnValue({
      data: mockCreditNoteData,
      loading: false,
      error: null,
    })

    mockUseSyncIntegrationCreditNoteMutation.mockReturnValue([jest.fn(), { loading: false }])

    mockUseRetryTaxReportingMutation.mockReturnValue([jest.fn()])
  })

  afterEach(cleanup)

  describe('rendering', () => {
    it('renders the credit note number in the header', async () => {
      await act(() => render(<CreditNoteDetails />))

      // Use getAllByText since CN-001 appears multiple times
      const creditNoteNumbers = screen.getAllByText('CN-001')

      expect(creditNoteNumbers.length).toBeGreaterThan(0)
    })

    it('renders the actions button', async () => {
      await act(() => render(<CreditNoteDetails />))

      // "Actions" button (text_637655cb50f04bf1c8379ce8)
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('renders the navigation tabs', async () => {
      await act(() => render(<CreditNoteDetails />))

      // Use getAllByText since Overview appears multiple times
      const overviewTabs = screen.getAllByText('Overview')

      expect(overviewTabs.length).toBeGreaterThan(0)
    })

    it('renders the back button', async () => {
      await act(() => render(<CreditNoteDetails />))

      const buttons = screen.getAllByTestId('button')
      const backButton = buttons.find((btn) => btn.querySelector('[data-test*="arrow-left"]'))

      expect(backButton).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeleton when loading', async () => {
      mockUseGetCreditNoteForDetailsQuery.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      })

      await act(() => render(<CreditNoteDetails />))

      // Should show skeleton instead of credit note number
      expect(screen.queryByText('CN-001')).not.toBeInTheDocument()
    })

    it('does not render actions button when loading', async () => {
      mockUseGetCreditNoteForDetailsQuery.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      })

      await act(() => render(<CreditNoteDetails />))

      expect(screen.queryByText('Actions')).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows error placeholder when there is an error', async () => {
      mockUseGetCreditNoteForDetailsQuery.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed to load'),
      })

      await act(() => render(<CreditNoteDetails />))

      // Check for error image or error text
      expect(screen.queryByText('Actions')).not.toBeInTheDocument()
    })

    it('shows error placeholder when credit note is null', async () => {
      mockUseGetCreditNoteForDetailsQuery.mockReturnValue({
        data: { creditNote: null },
        loading: false,
        error: null,
      })

      await act(() => render(<CreditNoteDetails />))

      // Check that normal content is not rendered
      expect(screen.queryByText('Actions')).not.toBeInTheDocument()
    })
  })

  describe('snapshots', () => {
    it('matches snapshot in loading state', async () => {
      mockUseGetCreditNoteForDetailsQuery.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      })

      const { container } = await act(() => render(<CreditNoteDetails />))

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with credit note data', async () => {
      const { container } = await act(() => render(<CreditNoteDetails />))

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot in error state', async () => {
      mockUseGetCreditNoteForDetailsQuery.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed'),
      })

      const { container } = await act(() => render(<CreditNoteDetails />))

      expect(container).toMatchSnapshot()
    })
  })
})
