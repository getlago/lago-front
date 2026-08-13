import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  InvoiceForInvoiceListFragment,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  InvoiceTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { CustomerInvoicesList } from '../CustomerInvoicesList'

// Mock IntersectionObserver for InfiniteScroll component
const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver

const mockCanDelete = jest.fn(() => false)

jest.mock('~/hooks/usePermissionsInvoiceActions', () => ({
  usePermissionsInvoiceActions: () => ({
    canDownload: () => true,
    canFinalize: () => false,
    canRetryCollect: () => false,
    canGeneratePaymentUrl: () => false,
    canUpdatePaymentStatus: () => false,
    canVoid: () => false,
    canDelete: mockCanDelete,
    canIssueCreditNote: () => false,
    canRecordPayment: () => false,
    canResendEmail: () => false,
    canRegenerate: () => false,
  }),
}))

const mockOpenDeleteInvoiceDialog = jest.fn()

jest.mock('~/components/invoices/DeleteInvoiceDialog', () => ({
  useDeleteInvoiceDialog: () => ({
    openDeleteInvoiceDialog: mockOpenDeleteInvoiceDialog,
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

const createMockInvoice = (
  overrides?: Partial<InvoiceForInvoiceListFragment['collection'][number]>,
): InvoiceForInvoiceListFragment['collection'][number] => ({
  id: 'invoice-1',
  status: InvoiceStatusTypeEnum.Finalized,
  taxStatus: null,
  paymentStatus: InvoicePaymentStatusTypeEnum.Pending,
  paymentOverdue: false,
  number: 'INV-001',
  issuingDate: '2024-01-15',
  totalAmountCents: '10000',
  totalDueAmountCents: '10000',
  totalPaidAmountCents: '0',
  currency: CurrencyEnum.Eur,
  voidable: true,
  paymentDisputeLostAt: null,
  taxProviderVoidable: false,
  invoiceType: InvoiceTypeEnum.Subscription,
  associatedActiveWalletPresent: false,
  voidedInvoiceId: null,
  regeneratedInvoiceId: null,
  customer: {
    id: 'customer-1',
    externalId: 'ext-1',
    name: 'Test Customer',
    displayName: 'Test Customer',
    applicableTimezone: TimezoneEnum.TzUtc,
    paymentProvider: null,
    hasActiveWallet: false,
  },
  errorDetails: [],
  billingEntity: {
    id: 'billing-1',
    name: 'Billing Entity',
    code: 'BE-001',
    einvoicing: false,
  },
  ...overrides,
})

const createMockInvoiceData = (
  invoices: InvoiceForInvoiceListFragment['collection'] = [],
): InvoiceForInvoiceListFragment => ({
  collection: invoices,
  metadata: {
    currentPage: 1,
    totalCount: invoices.length,
    totalPages: 1,
  },
})

const defaultProps = {
  isLoading: false,
  customerId: 'customer-1',
}

const renderComponent = (props = {}) => {
  return render(<CustomerInvoicesList {...defaultProps} {...props} />, {
    wrapper: AllTheProviders,
  })
}

describe('CustomerInvoicesList', () => {
  describe('GIVEN invoices data', () => {
    it('THEN should render invoices in the table', () => {
      const invoices = [
        createMockInvoice({ id: 'inv-1', number: 'INV-001' }),
        createMockInvoice({ id: 'inv-2', number: 'INV-002' }),
      ]

      renderComponent({ invoiceData: createMockInvoiceData(invoices) })

      expect(screen.getByText('INV-001')).toBeInTheDocument()
      expect(screen.getByText('INV-002')).toBeInTheDocument()
    })
  })

  describe('GIVEN no invoices', () => {
    it('THEN should show empty state', () => {
      renderComponent({ invoiceData: createMockInvoiceData([]) })

      expect(screen.getByText('empty.svg')).toBeInTheDocument()
    })
  })

  describe('GIVEN loading state', () => {
    it('THEN should render the full-list skeleton on the first load', () => {
      renderComponent({ isLoading: true, invoiceData: createMockInvoiceData([]) })

      const bodyRows = screen.queryAllByRole('rowgroup')[1]

      // First load with no data → skeleton rows fill the list
      expect(bodyRows?.querySelectorAll('tr').length ?? 0).toBeGreaterThan(0)
    })
  })

  describe('GIVEN a draft invoice and delete permission', () => {
    it('THEN should open the delete dialog when the delete action is clicked', async () => {
      const user = userEvent.setup()

      mockCanDelete.mockReturnValue(true)

      renderComponent({
        invoiceData: createMockInvoiceData([
          createMockInvoice({ status: InvoiceStatusTypeEnum.Draft }),
        ]),
      })

      await waitFor(() => user.click(screen.getByTestId('open-action-button')))

      const deleteButton = screen.getByRole('button', { name: 'Delete invoice' })

      await waitFor(() => user.click(deleteButton))

      expect(mockOpenDeleteInvoiceDialog).toHaveBeenCalled()
    })
  })
})
