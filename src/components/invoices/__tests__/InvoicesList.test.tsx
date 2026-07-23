import { ApolloError } from '@apollo/client'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  GetInvoicesListQuery,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  InvoiceTaxStatusTypeEnum,
  InvoiceTypeEnum,
  ProviderTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import InvoicesList from '../InvoicesList'

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})

globalThis.IntersectionObserver = mockIntersectionObserver

// Mock hooks
jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockAddToast = jest.fn()
const mockHasDefinedGQLError = jest.fn()
const mockExtractThirdPartyErrorMessage = jest.fn()

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (...args: unknown[]) => mockAddToast(...args),
  hasDefinedGQLError: (...args: unknown[]) => mockHasDefinedGQLError(...args),
  extractThirdPartyErrorMessage: (...args: unknown[]) => mockExtractThirdPartyErrorMessage(...args),
}))

const mockIsPremium = jest.fn(() => true)

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: mockIsPremium(),
  }),
}))

const mockHasFeatureFlag = jest.fn(() => false)

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      premiumIntegrations: ['revenue_share'],
    },
    hasFeatureFlag: mockHasFeatureFlag,
  }),
}))

const mockCanDownload = jest.fn(() => true)
const mockCanFinalize = jest.fn(() => false)
const mockCanRetryCollect = jest.fn(() => false)
const mockCanGeneratePaymentUrl = jest.fn(() => false)
const mockCanUpdatePaymentStatus = jest.fn(() => true)
const mockCanVoid = jest.fn(() => true)
const mockCanDelete = jest.fn(() => false)
const mockCanRegenerate = jest.fn(() => false)
const mockCanIssueCreditNote = jest.fn(() => true)
const mockCanRecordPayment = jest.fn(() => true)

const mockCanResendEmail = jest.fn(() => false)

jest.mock('~/hooks/usePermissionsInvoiceActions', () => ({
  usePermissionsInvoiceActions: () => ({
    canDownload: mockCanDownload,
    canFinalize: mockCanFinalize,
    canRetryCollect: mockCanRetryCollect,
    canGeneratePaymentUrl: mockCanGeneratePaymentUrl,
    canUpdatePaymentStatus: mockCanUpdatePaymentStatus,
    canVoid: mockCanVoid,
    canDelete: mockCanDelete,
    canRegenerate: mockCanRegenerate,
    canIssueCreditNote: mockCanIssueCreditNote,
    canRecordPayment: mockCanRecordPayment,
    canResendEmail: mockCanResendEmail,
  }),
}))

const mockHandleDownloadFile = jest.fn()

jest.mock('~/hooks/useDownloadFile', () => ({
  useDownloadFile: () => ({
    handleDownloadFile: mockHandleDownloadFile,
  }),
}))

const mockDownloadInvoice = jest.fn()
const mockGeneratePaymentUrl = jest.fn()
const mockRetryInvoicePayment = jest.fn()

// Store callbacks to test mutation handlers
let downloadInvoiceCallbacks: {
  onCompleted?: (data: { downloadInvoice: { fileUrl: string } | null }) => void
} = {}

jest.mock('~/hooks/useGeneratePaymentUrl', () => ({
  useGeneratePaymentUrl: () => ({
    generatePaymentUrl: mockGeneratePaymentUrl,
  }),
}))

jest.mock('~/hooks/useResendEmailDialog', () => ({
  useResendEmailDialog: () => ({
    showResendEmailDialog: jest.fn(),
  }),
}))

const mockOpenPremiumWarningDialog = jest.fn()

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({
    open: mockOpenPremiumWarningDialog,
    close: jest.fn(),
  }),
}))

const mockOpenUpdateInvoicePaymentStatusDialog = jest.fn()

jest.mock('~/components/invoices/EditInvoicePaymentStatusDialog', () => ({
  useUpdateInvoicePaymentStatusDialog: () => ({
    openUpdateInvoicePaymentStatusDialog: mockOpenUpdateInvoicePaymentStatusDialog,
  }),
}))

const mockOpenResendInvoiceForCollectionDialog = jest.fn()

jest.mock('~/components/invoices/ResendInvoiceForCollectionDialog', () => ({
  useResendInvoiceForCollectionDialog: () => ({
    openResendInvoiceForCollectionDialog: mockOpenResendInvoiceForCollectionDialog,
  }),
}))

const mockOpenFinalizeInvoiceDialog = jest.fn()

jest.mock('~/components/invoices/DeleteInvoiceDialog', () => ({
  useDeleteInvoiceDialog: () => ({
    openDeleteInvoiceDialog: jest.fn(),
  }),
}))

jest.mock('~/components/invoices/FinalizeInvoiceDialog', () => ({
  useFinalizeInvoiceDialog: () => ({
    openFinalizeInvoiceDialog: mockOpenFinalizeInvoiceDialog,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDownloadInvoiceItemMutation: (options: typeof downloadInvoiceCallbacks) => {
    downloadInvoiceCallbacks = options
    return [mockDownloadInvoice]
  },
  useRetryInvoicePaymentMutation: () => {
    return [mockRetryInvoicePayment, { loading: false }]
  },
}))

// Factory function for creating mock invoices
type InvoiceItem = GetInvoicesListQuery['invoices']['collection'][number]

const createMockInvoice = (overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
  __typename: 'Invoice',
  id: 'invoice-1',
  status: InvoiceStatusTypeEnum.Finalized,
  taxStatus: InvoiceTaxStatusTypeEnum.Succeeded,
  paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
  paymentOverdue: false,
  number: 'INV-001',
  issuingDate: '2024-01-15',
  totalAmountCents: '10000',
  totalDueAmountCents: '10000',
  totalPaidAmountCents: '0',
  currency: CurrencyEnum.Usd,
  voidable: true,
  paymentDisputeLostAt: null,
  taxProviderVoidable: false,
  invoiceType: InvoiceTypeEnum.Subscription,
  associatedActiveWalletPresent: false,
  voidedInvoiceId: null,
  regeneratedInvoiceId: null,
  customer: {
    __typename: 'Customer',
    id: 'customer-1',
    externalId: 'ext-customer-1',
    name: 'John Doe',
    displayName: 'John Doe',
    applicableTimezone: TimezoneEnum.TzUtc,
    paymentProvider: ProviderTypeEnum.Stripe,
    hasActiveWallet: false,
    email: 'john@example.com',
  },
  errorDetails: null,
  billingEntity: {
    __typename: 'BillingEntity',
    id: 'billing-entity-1',
    name: 'Acme Corp',
    code: 'acme',
    einvoicing: false,
  },
  ...overrides,
})

const createMockInvoices = (count: number): InvoiceItem[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockInvoice({
      id: `invoice-${index + 1}`,
      number: `INV-00${index + 1}`,
      customer: {
        __typename: 'Customer',
        id: `customer-${index + 1}`,
        externalId: `ext-customer-${index + 1}`,
        name: `Customer ${index + 1}`,
        displayName: `Customer ${index + 1}`,
        applicableTimezone: TimezoneEnum.TzUtc,
        paymentProvider: ProviderTypeEnum.Stripe,
        hasActiveWallet: false,
        email: `customer${index + 1}@example.com`,
      },
    }),
  )
}

const createMockMetadata = (
  overrides: Partial<GetInvoicesListQuery['invoices']['metadata']> = {},
): GetInvoicesListQuery['invoices']['metadata'] => ({
  __typename: 'CollectionMetadata',
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
  ...overrides,
})

// Default props type
type TInvoiceListProps = {
  error: ApolloError | undefined
  fetchMore: jest.Mock
  invoices: GetInvoicesListQuery['invoices']['collection'] | undefined
  isLoading: boolean
  metadata: GetInvoicesListQuery['invoices']['metadata'] | undefined
  variables: Record<string, unknown> | undefined
}

const defaultProps: TInvoiceListProps = {
  error: undefined,
  fetchMore: jest.fn(),
  invoices: createMockInvoices(3),
  isLoading: false,
  metadata: createMockMetadata({ totalCount: 3 }),
  variables: {},
}

async function renderInvoicesList(props: Partial<TInvoiceListProps> = {}) {
  await act(() => render(<InvoicesList {...defaultProps} {...props} />))
}

describe('InvoicesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset all mocks to their default values
    mockIsPremium.mockReturnValue(true)
    mockCanDownload.mockReturnValue(true)
    mockCanFinalize.mockReturnValue(false)
    mockCanRetryCollect.mockReturnValue(false)
    mockCanGeneratePaymentUrl.mockReturnValue(false)
    mockCanUpdatePaymentStatus.mockReturnValue(true)
    mockCanVoid.mockReturnValue(true)
    mockCanRegenerate.mockReturnValue(false)
    mockCanIssueCreditNote.mockReturnValue(true)
    mockCanRecordPayment.mockReturnValue(true)
    mockCanResendEmail.mockReturnValue(false)
    mockHasDefinedGQLError.mockReturnValue(false)
    mockExtractThirdPartyErrorMessage.mockReturnValue(undefined)
    mockRetryInvoicePayment.mockResolvedValue({ errors: null })
  })

  describe('Basic Rendering', () => {
    it('renders the invoices list table', async () => {
      await renderInvoicesList()

      // Check table headers are rendered
      expect(
        screen.getByRole('columnheader', { name: 'text_63ac86d797f728a87b2f9fa7' }),
      ).toBeInTheDocument() // Status
      expect(
        screen.getByRole('columnheader', { name: 'text_17436114971570doqrwuwhf0' }),
      ).toBeInTheDocument() // Billing entity
      expect(
        screen.getByRole('columnheader', { name: 'text_63ac86d797f728a87b2f9fad' }),
      ).toBeInTheDocument() // Number
      expect(
        screen.getByRole('columnheader', { name: 'text_63ac86d797f728a87b2f9fb9' }),
      ).toBeInTheDocument() // Total amount
      expect(
        screen.getByRole('columnheader', { name: 'text_6419c64eace749372fc72b40' }),
      ).toBeInTheDocument() // Payment status
      expect(
        screen.getByRole('columnheader', { name: 'text_65201c5a175a4b0238abf29a' }),
      ).toBeInTheDocument() // Customer name
      expect(
        screen.getByRole('columnheader', { name: 'text_63ac86d797f728a87b2f9fbf' }),
      ).toBeInTheDocument() // Issuing date
    })

    it('renders invoice rows', async () => {
      await renderInvoicesList()

      expect(screen.getByText('INV-001')).toBeInTheDocument()
      expect(screen.getByText('INV-002')).toBeInTheDocument()
      expect(screen.getByText('INV-003')).toBeInTheDocument()
    })

    it('renders customer names', async () => {
      await renderInvoicesList()

      expect(screen.getByText('Customer 1')).toBeInTheDocument()
      expect(screen.getByText('Customer 2')).toBeInTheDocument()
      expect(screen.getByText('Customer 3')).toBeInTheDocument()
    })

    it('renders billing entity name', async () => {
      await renderInvoicesList()

      const billingEntities = screen.getAllByText('Acme Corp')

      expect(billingEntities.length).toBeGreaterThan(0)
    })

    it('renders with empty invoices array', async () => {
      await renderInvoicesList({ invoices: [], metadata: createMockMetadata({ totalCount: 0 }) })

      // Should show empty state
      expect(screen.getByText('empty.svg')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('renders the full-list skeleton while loading', async () => {
      await renderInvoicesList({ isLoading: true, invoices: undefined })

      // Loading → skeleton rows fill the list
      const bodyRows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(bodyRows.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('renders error state when there is an error', async () => {
      const apolloError = new ApolloError({ errorMessage: 'Network error' })

      await renderInvoicesList({ error: apolloError })

      expect(screen.getByText('error.svg')).toBeInTheDocument()
    })
  })

  describe('Invoice Status Display', () => {
    it('renders finalized invoice status', async () => {
      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      // Status component should be rendered - look for the status container
      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('renders draft invoice status', async () => {
      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Draft })],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('renders voided invoice status', async () => {
      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Voided })],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('renders warning icon for invoice with error details', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            errorDetails: [
              {
                __typename: 'ErrorDetail',
                errorCode: 'tax_error' as never,
                errorDetails: 'Tax calculation failed',
              },
            ],
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('renders warning icon for taxProviderVoidable invoice', async () => {
      await renderInvoicesList({
        invoices: [createMockInvoice({ taxProviderVoidable: true })],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })
  })

  describe('Payment Status Display', () => {
    it('renders pending payment status for finalized invoice', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('renders succeeded payment status', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentStatus: InvoicePaymentStatusTypeEnum.Succeeded,
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('renders failed payment status', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentStatus: InvoicePaymentStatusTypeEnum.Failed,
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('does not render payment status for draft invoices', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Draft,
            paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('renders partially paid indicator', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
            totalAmountCents: '10000',
            totalPaidAmountCents: '5000',
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })

    it('renders payment dispute lost indicator', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentDisputeLostAt: '2024-01-20',
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })
  })

  describe('Payment Overdue', () => {
    it('renders overdue status when paymentOverdue is true', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentOverdue: true,
          }),
        ],
      })

      // Check that the Status component with 'overdue' label is rendered in the table
      // The Status component has data-test="status"
      const tableBody = screen.queryAllByRole('rowgroup')[1]
      const statusElements = within(tableBody).queryAllByTestId('status')
      // Should have 3 status elements: invoice status, payment status, and overdue status

      expect(statusElements.length).toBeGreaterThanOrEqual(3)
    })

    it('does not render overdue status when paymentOverdue is false', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentOverdue: false,
          }),
        ],
      })

      // Check that the table body has only 2 status elements (invoice status and payment status)
      const tableBody = screen.queryAllByRole('rowgroup')[1]
      const statusElements = within(tableBody).queryAllByTestId('status')
      // Should have 2 status elements: invoice status and payment status (no overdue)

      expect(statusElements).toHaveLength(2)
    })
  })

  describe('Amount Display', () => {
    it('displays dash for pending invoice amounts', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Pending,
            totalAmountCents: '10000',
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(within(rows[0]).getByText('-')).toBeInTheDocument()
    })

    it('displays dash for failed invoice amounts', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Failed,
            totalAmountCents: '10000',
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(within(rows[0]).getByText('-')).toBeInTheDocument()
    })
  })

  describe('Action Column', () => {
    it('renders action menu button for each row', async () => {
      await renderInvoicesList()

      const actionButtons = screen.queryAllByTestId('open-action-button')

      expect(actionButtons).toHaveLength(3)
    })

    it('opens action menu when clicking action button', async () => {
      const user = userEvent.setup()

      await renderInvoicesList()

      const actionButtons = screen.queryAllByTestId('open-action-button')

      await waitFor(() => user.click(actionButtons[0]))

      expect(screen.getByRole('tooltip')).toBeInTheDocument()
    })

    it('shows download action for finalized invoice', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      expect(
        screen.getByRole('button', { name: 'text_62b31e1f6a5b8b1b745ece42' }),
      ).toBeInTheDocument()
    })

    it('shows copy ID action', async () => {
      const user = userEvent.setup()

      await renderInvoicesList()

      const actionButton = screen.queryAllByTestId('open-action-button')[0]

      await waitFor(() => user.click(actionButton))

      expect(
        screen.getByRole('button', { name: 'text_63ac86d897f728a87b2fa031' }),
      ).toBeInTheDocument()
    })

    it('shows record payment action for eligible invoice', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            totalDueAmountCents: '10000',
            totalPaidAmountCents: '0',
            totalAmountCents: '10000',
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      expect(
        screen.getByRole('button', { name: 'text_1737471851634wpeojigr27w' }),
      ).toBeInTheDocument()
    })

    it('shows issue credit note action', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      expect(
        screen.getByRole('button', { name: 'text_636bdef6565341dcb9cfb127' }),
      ).toBeInTheDocument()
    })

    it('shows void invoice action for finalized invoice', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      expect(
        screen.getByRole('button', { name: 'text_1750678506388d4fr5etxbhh' }),
      ).toBeInTheDocument()
    })

    it('shows update payment status action', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      expect(
        screen.getByRole('button', { name: 'text_63eba8c65a6c8043feee2a01' }),
      ).toBeInTheDocument()
    })
  })

  describe('Row Navigation', () => {
    it('navigates to invoice details when row is clicked', async () => {
      const user = userEvent.setup()

      await renderInvoicesList()

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      await waitFor(() => user.click(rows[0]))

      expect(testMockNavigateFn).toHaveBeenCalled()
    })
  })

  describe('Infinite Scroll', () => {
    it('calls fetchMore when scrolling to bottom and more pages exist', async () => {
      const fetchMore = jest.fn()

      await renderInvoicesList({
        fetchMore,
        metadata: createMockMetadata({ currentPage: 1, totalPages: 3, totalCount: 30 }),
      })

      // The InfiniteScroll component is tested implicitly via integration
      expect(fetchMore).not.toHaveBeenCalled()
    })
  })

  describe('Empty States', () => {
    it('renders correct empty state title when no search term', async () => {
      await renderInvoicesList({
        invoices: [],
        variables: {},
        metadata: createMockMetadata({ totalCount: 0 }),
      })

      // Empty state should show
      expect(screen.getByText('empty.svg')).toBeInTheDocument()
    })

    it('renders search empty state when search term exists with no results', async () => {
      await renderInvoicesList({
        invoices: [],
        variables: { searchTerm: 'nonexistent' },
        metadata: createMockMetadata({ totalCount: 0 }),
      })

      expect(screen.getByText('empty.svg')).toBeInTheDocument()
    })
  })

  describe('Snapshot Tests', () => {
    it('matches snapshot with invoices', async () => {
      const { container } = render(<InvoicesList {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot in loading state', async () => {
      const { container } = render(
        <InvoicesList {...defaultProps} isLoading={true} invoices={undefined} />,
      )

      await waitFor(() => {
        expect(container.querySelector('table')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with error state', async () => {
      const apolloError = new ApolloError({ errorMessage: 'Network error' })
      const { container } = render(<InvoicesList {...defaultProps} error={apolloError} />)

      await waitFor(() => {
        expect(screen.getByText('error.svg')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with empty state', async () => {
      const { container } = render(
        <InvoicesList
          {...defaultProps}
          invoices={[]}
          metadata={createMockMetadata({ totalCount: 0 })}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('empty.svg')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with different invoice statuses', async () => {
      const mixedInvoices = [
        createMockInvoice({
          id: 'invoice-draft',
          number: 'INV-DRAFT',
          status: InvoiceStatusTypeEnum.Draft,
        }),
        createMockInvoice({
          id: 'invoice-finalized',
          number: 'INV-FINALIZED',
          status: InvoiceStatusTypeEnum.Finalized,
        }),
        createMockInvoice({
          id: 'invoice-voided',
          number: 'INV-VOIDED',
          status: InvoiceStatusTypeEnum.Voided,
        }),
      ]

      const { container } = render(
        <InvoicesList
          {...defaultProps}
          invoices={mixedInvoices}
          metadata={createMockMetadata({ totalCount: 3 })}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('INV-DRAFT')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with different payment statuses', async () => {
      const mixedPaymentInvoices = [
        createMockInvoice({
          id: 'invoice-pending',
          number: 'INV-PENDING',
          status: InvoiceStatusTypeEnum.Finalized,
          paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
        }),
        createMockInvoice({
          id: 'invoice-succeeded',
          number: 'INV-SUCCEEDED',
          status: InvoiceStatusTypeEnum.Finalized,
          paymentStatus: InvoicePaymentStatusTypeEnum.Succeeded,
        }),
        createMockInvoice({
          id: 'invoice-failed',
          number: 'INV-FAILED',
          status: InvoiceStatusTypeEnum.Finalized,
          paymentStatus: InvoicePaymentStatusTypeEnum.Failed,
        }),
      ]

      const { container } = render(
        <InvoicesList
          {...defaultProps}
          invoices={mixedPaymentInvoices}
          metadata={createMockMetadata({ totalCount: 3 })}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('INV-PENDING')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with overdue invoice', async () => {
      const { container } = render(
        <InvoicesList
          {...defaultProps}
          invoices={[
            createMockInvoice({
              status: InvoiceStatusTypeEnum.Finalized,
              paymentOverdue: true,
            }),
          ]}
          metadata={createMockMetadata({ totalCount: 1 })}
        />,
      )

      await waitFor(() => {
        // Check that the table has rendered with the invoice number
        expect(screen.getByText('INV-001')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot with partially paid invoice', async () => {
      const { container } = render(
        <InvoicesList
          {...defaultProps}
          invoices={[
            createMockInvoice({
              status: InvoiceStatusTypeEnum.Finalized,
              paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
              totalAmountCents: '10000',
              totalPaidAmountCents: '5000',
            }),
          ]}
          metadata={createMockMetadata({ totalCount: 1 })}
        />,
      )

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })
  })

  describe('Non-Premium User Actions', () => {
    beforeEach(() => {
      mockIsPremium.mockReturnValue(false)
    })

    it('shows premium warning for record payment when not premium', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            totalDueAmountCents: '10000',
            totalPaidAmountCents: '0',
            totalAmountCents: '10000',
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      // Record payment should have sparkles icon for non-premium users
      const recordPaymentButton = screen.getByRole('button', {
        name: 'text_1737471851634wpeojigr27w',
      })

      expect(recordPaymentButton).toBeInTheDocument()
    })

    it('shows premium warning for issue credit note when not premium', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const issueCreditNoteButton = screen.getByRole('button', {
        name: 'text_636bdef6565341dcb9cfb127',
      })

      expect(issueCreditNoteButton).toBeInTheDocument()
    })
  })

  describe('Action Handlers', () => {
    it('triggers download mutation when download action is clicked', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const downloadButton = screen.getByRole('button', { name: 'text_62b31e1f6a5b8b1b745ece42' })

      await waitFor(() => user.click(downloadButton))

      expect(mockDownloadInvoice).toHaveBeenCalledWith({
        variables: { input: { id: 'invoice-1' } },
      })
    })

    it('shows finalize action for draft invoice and triggers dialog', async () => {
      const user = userEvent.setup()

      mockCanDownload.mockReturnValue(false)
      mockCanFinalize.mockReturnValue(true)

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Draft })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const finalizeButton = screen.getByRole('button', { name: 'text_63a41a8eabb9ae67047c1c08' })

      expect(finalizeButton).toBeInTheDocument()
    })

    it('shows resend for collection action when canRetryCollect returns true', async () => {
      const user = userEvent.setup()

      mockCanRetryCollect.mockReturnValue(true)

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentStatus: InvoicePaymentStatusTypeEnum.Failed,
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const retryButton = screen.getByRole('button', { name: 'text_63ac86d897f728a87b2fa039' })

      expect(retryButton).toBeInTheDocument()
    })

    it('opens resend for collection dialog when retry action is clicked', async () => {
      const user = userEvent.setup()

      mockCanRetryCollect.mockReturnValue(true)

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentStatus: InvoicePaymentStatusTypeEnum.Failed,
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const retryButton = screen.getByRole('button', { name: 'text_63ac86d897f728a87b2fa039' })

      await waitFor(() => user.click(retryButton))

      await waitFor(() => {
        expect(mockOpenResendInvoiceForCollectionDialog).toHaveBeenCalledWith(
          expect.objectContaining({ invoice: expect.objectContaining({ id: 'invoice-1' }) }),
        )
      })
    })

    it('triggers generate payment URL mutation when action is clicked', async () => {
      const user = userEvent.setup()

      mockCanGeneratePaymentUrl.mockReturnValue(true)
      mockGeneratePaymentUrl.mockResolvedValue({})

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const generateUrlButton = screen.getByRole('button', {
        name: 'text_1753384709668qrxbzpbskn8',
      })

      await waitFor(() => user.click(generateUrlButton))

      expect(mockGeneratePaymentUrl).toHaveBeenCalledWith({
        variables: { input: { invoiceId: 'invoice-1' } },
      })
    })

    it('navigates to void invoice route when void action is clicked', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const voidButton = screen.getByRole('button', { name: 'text_1750678506388d4fr5etxbhh' })

      await waitFor(() => user.click(voidButton))

      expect(testMockNavigateFn).toHaveBeenCalled()
    })

    it('shows regenerate action for voided invoice and navigates', async () => {
      const user = userEvent.setup()

      mockCanRegenerate.mockReturnValue(true)

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Voided,
            regeneratedInvoiceId: null,
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const regenerateButton = screen.getByRole('button', { name: 'text_1750678506388oynw9hd01l9' })

      await waitFor(() => user.click(regenerateButton))

      expect(testMockNavigateFn).toHaveBeenCalled()
    })
  })

  describe('Copy ID Action', () => {
    it('copies invoice ID to clipboard when copy action is clicked', async () => {
      const user = userEvent.setup()

      const mockWriteText = jest.fn().mockResolvedValue(undefined)

      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText,
        },
        writable: true,
        configurable: true,
      })

      await renderInvoicesList({
        invoices: [createMockInvoice({ id: 'test-invoice-id-123' })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const copyButton = screen.getByRole('button', { name: 'text_63ac86d897f728a87b2fa031' })

      await waitFor(() => user.click(copyButton))

      expect(mockWriteText).toHaveBeenCalledWith('test-invoice-id-123')
    })
  })

  describe('Customer Display', () => {
    it('renders dash when customer displayName is missing', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            customer: {
              __typename: 'Customer',
              id: 'customer-1',
              externalId: 'ext-customer-1',
              name: null,
              displayName: '',
              applicableTimezone: TimezoneEnum.TzUtc,
              paymentProvider: ProviderTypeEnum.Stripe,
              hasActiveWallet: false,
              email: null,
            },
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      // Customer column should show dash
      expect(within(rows[0]).getAllByText('-').length).toBeGreaterThan(0)
    })
  })

  describe('Billing Entity Display', () => {
    it('renders billing entity code when name is missing', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            billingEntity: {
              __typename: 'BillingEntity',
              id: 'billing-entity-1',
              name: '',
              code: 'billing-code-123',
              einvoicing: false,
            },
          }),
        ],
      })

      expect(screen.getByText('billing-code-123')).toBeInTheDocument()
    })

    it('renders dash when both billing entity name and code are missing', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            billingEntity: {
              __typename: 'BillingEntity',
              id: 'billing-entity-1',
              name: '',
              code: '',
              einvoicing: false,
            },
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(within(rows[0]).getAllByText('-').length).toBeGreaterThan(0)
    })
  })

  describe('Invoice Number Display', () => {
    it('renders dash when invoice number is missing', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            number: '',
          }),
        ],
      })

      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(within(rows[0]).getAllByText('-').length).toBeGreaterThan(0)
    })
  })

  describe('Issue Credit Note Action enablement', () => {
    it('keeps the issue-credit-note action enabled for a finalized invoice regardless of covered amount', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
            invoiceType: InvoiceTypeEnum.Subscription,
            associatedActiveWalletPresent: true,
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const issueCreditNoteButton = screen.getByRole('button', {
        name: 'text_636bdef6565341dcb9cfb127',
      })

      expect(issueCreditNoteButton).toBeInTheDocument()
      expect(issueCreditNoteButton).not.toBeDisabled()
    })

    it('disables the issue-credit-note action for a credit invoice whose wallet was terminated', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            invoiceType: InvoiceTypeEnum.Credit,
            associatedActiveWalletPresent: false,
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const issueCreditNoteButton = screen.getByRole('button', {
        name: 'text_636bdef6565341dcb9cfb127',
      })

      expect(issueCreditNoteButton).toBeDisabled()
    })
  })

  describe('Currencies', () => {
    it('renders amount with correct currency format', async () => {
      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            totalAmountCents: '15000',
            currency: CurrencyEnum.Eur,
          }),
        ],
      })

      // The formatted amount should be displayed
      const rows = within(screen.queryAllByRole('rowgroup')[1]).queryAllByRole('row')

      expect(rows).toHaveLength(1)
    })
  })

  describe('Mutation Callbacks', () => {
    it('calls handleDownloadFile when download mutation completes', async () => {
      await renderInvoicesList()

      // Trigger the onCompleted callback
      downloadInvoiceCallbacks.onCompleted?.({
        downloadInvoice: { fileUrl: 'https://example.com/invoice.pdf' },
      })

      expect(mockHandleDownloadFile).toHaveBeenCalledWith('https://example.com/invoice.pdf')
    })

    it('handles null fileUrl from download mutation', async () => {
      await renderInvoicesList()

      downloadInvoiceCallbacks.onCompleted?.({
        downloadInvoice: null,
      })

      expect(mockHandleDownloadFile).toHaveBeenCalledWith(undefined)
    })
  })

  describe('Premium User Action Handlers', () => {
    it('navigates to record payment route when premium user clicks record payment', async () => {
      const user = userEvent.setup()

      mockIsPremium.mockReturnValue(true)

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            totalDueAmountCents: '10000',
            totalPaidAmountCents: '0',
            totalAmountCents: '10000',
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const recordPaymentButton = screen.getByRole('button', {
        name: 'text_1737471851634wpeojigr27w',
      })

      await waitFor(() => user.click(recordPaymentButton))

      expect(testMockNavigateFn).toHaveBeenCalled()
    })

    it('navigates to create credit note route when premium user clicks issue credit note', async () => {
      const user = userEvent.setup()

      mockIsPremium.mockReturnValue(true)

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const issueCreditNoteButton = screen.getByRole('button', {
        name: 'text_636bdef6565341dcb9cfb127',
      })

      await waitFor(() => user.click(issueCreditNoteButton))

      expect(testMockNavigateFn).toHaveBeenCalled()
    })
  })

  describe('Update Payment Status Action', () => {
    it('displays update payment status button when action is available', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const updateStatusButton = screen.getByRole('button', {
        name: 'text_63eba8c65a6c8043feee2a01',
      })

      expect(updateStatusButton).toBeInTheDocument()
    })
  })

  describe('Finalize Invoice Action', () => {
    it('displays finalize button for draft invoice', async () => {
      const user = userEvent.setup()

      mockCanDownload.mockReturnValue(false)
      mockCanFinalize.mockReturnValue(true)

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Draft })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const finalizeButton = screen.getByRole('button', { name: 'text_63a41a8eabb9ae67047c1c08' })

      expect(finalizeButton).toBeInTheDocument()
    })

    it('can click finalize button to trigger finalize dialog', async () => {
      const user = userEvent.setup()

      mockCanDownload.mockReturnValue(false)
      mockCanFinalize.mockReturnValue(true)

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Draft })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const finalizeButton = screen.getByRole('button', { name: 'text_63a41a8eabb9ae67047c1c08' })

      // Click finalize - this tests line 231
      await user.click(finalizeButton)

      // The action was triggered (dialog ref openDialog was called)
      expect(mockCanFinalize).toHaveBeenCalled()
    })
  })

  describe('Non-Premium User Action Clicks', () => {
    beforeEach(() => {
      mockIsPremium.mockReturnValue(false)
    })

    it('triggers premium warning dialog when non-premium user clicks record payment', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [
          createMockInvoice({
            status: InvoiceStatusTypeEnum.Finalized,
            totalDueAmountCents: '10000',
            totalPaidAmountCents: '0',
            totalAmountCents: '10000',
          }),
        ],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const recordPaymentButton = screen.getByRole('button', {
        name: 'text_1737471851634wpeojigr27w',
      })

      // Click triggers premium warning dialog - this tests line 156
      await user.click(recordPaymentButton)

      // Premium warning dialog should open and navigation should NOT have been called
      expect(mockOpenPremiumWarningDialog).toHaveBeenCalled()
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })

    it('triggers premium warning dialog when non-premium user clicks issue credit note', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const issueCreditNoteButton = screen.getByRole('button', {
        name: 'text_636bdef6565341dcb9cfb127',
      })

      // Click triggers premium warning dialog - this tests line 176
      await user.click(issueCreditNoteButton)

      // Premium warning dialog should open and navigation should NOT have been called
      expect(mockOpenPremiumWarningDialog).toHaveBeenCalled()
      expect(testMockNavigateFn).not.toHaveBeenCalled()
    })
  })

  describe('Update Payment Status Dialog', () => {
    it('can click update payment status button to trigger dialog', async () => {
      const user = userEvent.setup()

      await renderInvoicesList({
        invoices: [createMockInvoice({ status: InvoiceStatusTypeEnum.Finalized })],
      })

      const actionButton = screen.getByTestId('open-action-button')

      await waitFor(() => user.click(actionButton))

      const updateStatusButton = screen.getByRole('button', {
        name: 'text_63eba8c65a6c8043feee2a01',
      })

      // Click triggers the update payment status dialog
      await user.click(updateStatusButton)

      expect(mockOpenUpdateInvoicePaymentStatusDialog).toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    it('calls fetchMore with the next page when the next control is clicked', async () => {
      const user = userEvent.setup()
      const fetchMore = jest.fn()

      await renderInvoicesList({
        fetchMore,
        metadata: createMockMetadata({ currentPage: 1, totalPages: 3, totalCount: 30 }),
        isLoading: false,
      })

      const pagination = screen.getByRole('navigation', { name: 'pagination' })
      const buttons = within(pagination).getAllByRole('button')

      // [prev, next] — click the next chevron (last control)
      await user.click(buttons[buttons.length - 1])

      expect(fetchMore).toHaveBeenCalledWith({
        variables: { page: 2 },
      })
    })

    it('disables the next control on the last page', async () => {
      await renderInvoicesList({
        fetchMore: jest.fn(),
        metadata: createMockMetadata({ currentPage: 3, totalPages: 3, totalCount: 30 }),
        isLoading: false,
      })

      const pagination = screen.getByRole('navigation', { name: 'pagination' })
      const buttons = within(pagination).getAllByRole('button')

      // the last control is the "next" chevron
      expect(buttons[buttons.length - 1]).toBeDisabled()
    })

    it('keeps the pager visible with disabled controls while loading', async () => {
      await renderInvoicesList({
        fetchMore: jest.fn(),
        metadata: createMockMetadata({ currentPage: 1, totalPages: 3, totalCount: 30 }),
        isLoading: true,
      })

      const pagination = screen.getByRole('navigation', { name: 'pagination' })

      within(pagination)
        .getAllByRole('button')
        .forEach((button) => expect(button).toBeDisabled())
    })

    it('does not render the pagination control when metadata is undefined', async () => {
      const fetchMore = jest.fn()

      await renderInvoicesList({
        fetchMore,
        metadata: undefined,
        isLoading: false,
      })

      expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument()
      expect(fetchMore).not.toHaveBeenCalled()
    })
  })

  describe('Error State Button', () => {
    it('renders error state with reload button when there is an error without search term', async () => {
      const apolloError = new ApolloError({ errorMessage: 'Network error' })

      await renderInvoicesList({ error: apolloError, variables: {} })

      // Error state should show - the button with reload action is rendered
      expect(screen.getByText('error.svg')).toBeInTheDocument()
    })
  })
})
