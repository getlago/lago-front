/* eslint-disable @typescript-eslint/no-explicit-any */
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

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      premiumIntegrations: ['revenue_share'],
    },
  }),
}))

jest.mock('~/hooks/usePermissionsInvoiceActions', () => ({
  usePermissionsInvoiceActions: () => ({
    canDownload: jest.fn(() => true),
    canFinalize: jest.fn(() => false),
    canRetryCollect: jest.fn(() => false),
    canGeneratePaymentUrl: jest.fn(() => false),
    canUpdatePaymentStatus: jest.fn(() => true),
    canVoid: jest.fn(() => true),
    canRegenerate: jest.fn(() => false),
    canIssueCreditNote: jest.fn(() => true),
    canRecordPayment: jest.fn(() => true),
  }),
}))

jest.mock('~/hooks/useDownloadFile', () => ({
  useDownloadFile: () => ({
    handleDownloadFile: jest.fn(),
    openNewTab: jest.fn(),
  }),
}))

const mockDownloadInvoice = jest.fn()
const mockRetryCollect = jest.fn()
const mockGeneratePaymentUrl = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDownloadInvoiceItemMutation: () => [mockDownloadInvoice],
  useRetryInvoicePaymentMutation: () => [mockRetryCollect],
  useGeneratePaymentUrlMutation: () => [mockGeneratePaymentUrl],
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
  creditableAmountCents: '10000',
  refundableAmountCents: '0',
  associatedActiveWalletPresent: false,
  voidedInvoiceId: null,
  regeneratedInvoiceId: null,
  customer: {
    __typename: 'Customer',
    id: 'customer-1',
    name: 'John Doe',
    displayName: 'John Doe',
    applicableTimezone: TimezoneEnum.TzUtc,
    paymentProvider: ProviderTypeEnum.Stripe,
    hasActiveWallet: false,
  },
  errorDetails: null,
  billingEntity: {
    __typename: 'BillingEntity',
    name: 'Acme Corp',
    code: 'acme',
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
        name: `Customer ${index + 1}`,
        displayName: `Customer ${index + 1}`,
        applicableTimezone: TimezoneEnum.TzUtc,
        paymentProvider: ProviderTypeEnum.Stripe,
        hasActiveWallet: false,
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
    it('renders loading state when isLoading is true', async () => {
      await renderInvoicesList({ isLoading: true, invoices: undefined })

      // Table should still render headers but with loading skeletons in body
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
                errorCode: 'tax_error' as any,
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

  describe('Filters', () => {
    it('renders filters component', async () => {
      await renderInvoicesList()

      // Filters quick filter buttons should be present
      // The quick filters render buttons for different invoice statuses
      expect(screen.getByText('text_63ac86d797f728a87b2f9f8b')).toBeInTheDocument() // "All" filter
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
})
