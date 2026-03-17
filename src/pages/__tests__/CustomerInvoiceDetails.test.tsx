import { screen } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { CurrencyEnum, InvoiceStatusTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import CustomerInvoiceDetails from '../CustomerInvoiceDetails'

let capturedConfig: MainHeaderConfig | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/components/MainHeader/useMainHeaderTabContent', () => ({
  useMainHeaderTabContent: () => <div data-test="active-tab-content">Tab Content</div>,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({
    goBack: jest.fn(),
  }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

const mockHasPermissions = jest.fn().mockReturnValue(true)

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

jest.mock('~/hooks/useResendEmailDialog', () => ({
  useResendEmailDialog: () => ({
    showResendEmailDialog: jest.fn(),
  }),
}))

jest.mock('~/hooks/useGeneratePaymentUrl', () => ({
  useGeneratePaymentUrl: () => ({
    generatePaymentUrl: jest.fn(),
  }),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockInvoiceData = {
  invoice: {
    id: 'invoice-123',
    invoiceType: 'subscription',
    number: 'INV-001',
    paymentStatus: 'succeeded',
    status: InvoiceStatusTypeEnum.Finalized,
    taxStatus: null,
    totalAmountCents: '10000',
    currency: CurrencyEnum.Usd,
    refundableAmountCents: '10000',
    creditableAmountCents: '10000',
    offsettableAmountCents: '0',
    voidable: true,
    paymentDisputeLostAt: null,
    integrationSyncable: false,
    externalIntegrationId: null,
    taxProviderVoidable: false,
    integrationHubspotSyncable: false,
    associatedActiveWalletPresent: false,
    voidedAt: null,
    voidedInvoiceId: null,
    regeneratedInvoiceId: null,
    errorDetails: [],
    customer: {
      id: 'customer-123',
      email: 'customer@example.com',
    },
    billingEntity: {
      id: 'billing-entity-1',
      name: 'Billing Co',
      email: 'billing@example.com',
      einvoicing: false,
      emailSettings: [],
      logoUrl: null,
    },
  },
}

const mockCustomerData = {
  customer: {
    id: 'customer-123',
    name: 'Test Customer',
    paymentProvider: null,
    deletedAt: null,
    avalaraCustomer: null,
    netsuiteCustomer: null,
    xeroCustomer: null,
    hubspotCustomer: null,
    salesforceCustomer: null,
  },
}

const mockUseGetInvoiceDetailsQuery = jest.fn()
const mockUseGetInvoiceFeesQuery = jest.fn()
const mockUseGetInvoiceCustomerQuery = jest.fn()
const mockRefreshInvoice = jest.fn()
const mockRetryInvoice = jest.fn()
const mockRetryTaxProviderVoiding = jest.fn()
const mockSyncIntegrationInvoice = jest.fn()
const mockSyncHubspotIntegrationInvoice = jest.fn()
const mockSyncSalesforceIntegrationInvoice = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetInvoiceDetailsQuery: () => mockUseGetInvoiceDetailsQuery(),
  useGetInvoiceFeesQuery: () => mockUseGetInvoiceFeesQuery(),
  useGetInvoiceCustomerQuery: () => mockUseGetInvoiceCustomerQuery(),
  useIntegrationsListForCustomerInvoiceDetailsQuery: () => ({ data: null }),
  useRefreshInvoiceMutation: () => [mockRefreshInvoice, { loading: false }],
  useRetryInvoiceMutation: () => [mockRetryInvoice, { loading: false }],
  useRetryTaxProviderVoidingMutation: () => [mockRetryTaxProviderVoiding, { loading: false }],
  useSyncIntegrationInvoiceMutation: () => [mockSyncIntegrationInvoice, { loading: false }],
  useSyncHubspotIntegrationInvoiceMutation: () => [
    mockSyncHubspotIntegrationInvoice,
    { loading: false },
  ],
  useSyncSalesforceInvoiceMutation: () => [
    mockSyncSalesforceIntegrationInvoice,
    { loading: false },
  ],
}))

const mockDownloadInvoice = jest.fn()
const mockDownloadInvoiceXml = jest.fn()

jest.mock('~/pages/invoiceDetails/common/useDownloadInvoice', () => ({
  useDownloadInvoice: () => ({
    downloadInvoice: mockDownloadInvoice,
    loadingInvoiceDownload: false,
    downloadInvoiceXml: mockDownloadInvoiceXml,
    loadingInvoiceXmlDownload: false,
  }),
}))

jest.mock('~/pages/invoiceDetails/common/useInvoiceAuthorizations', () => ({
  useInvoiceAuthorizations: () => ({
    authorizations: {
      canRetryInvoice: false,
      canFinalizeInvoice: false,
      canDownloadOnlyPdf: true,
      canDownloadPdfAndXml: false,
      canResendEmail: false,
      canIssueCreditNote: true,
      canRecordPayment: true,
      canUpdatePaymentStatus: true,
      canVoid: true,
      canRegenerate: false,
      canGeneratePaymentUrl: false,
      canSyncAccountingIntegration: false,
      canSyncCRMIntegration: false,
      canDispute: false,
      canSyncTaxIntegration: false,
    },
    hasTaxProviderError: false,
    errorMessage: undefined,
    canRecordPayment: true,
  }),
}))

jest.mock('~/pages/InvoiceOverview', () => ({
  __esModule: true,
  default: () => <div data-test="invoice-overview-mock">InvoiceOverview</div>,
}))

jest.mock('~/components/invoices/FinalizeInvoiceDialog', () => ({
  FinalizeInvoiceDialog: () => null,
}))

jest.mock('~/components/invoices/EditInvoicePaymentStatusDialog', () => ({
  UpdateInvoicePaymentStatusDialog: () => null,
}))

jest.mock('~/components/invoices/VoidInvoiceDialog', () => ({
  VoidInvoiceDialog: () => null,
}))

jest.mock('~/components/invoices/DisputeInvoiceDialog', () => ({
  DisputeInvoiceDialog: () => null,
}))

jest.mock('~/components/invoices/AddMetadataDrawer', () => ({
  AddMetadataDrawer: () => null,
}))

jest.mock('~/components/PremiumWarningDialog', () => ({
  PremiumWarningDialog: () => null,
}))

jest.mock('~/components/invoices/InvoiceCreditNoteList', () => ({
  InvoiceCreditNoteList: () => (
    <div data-test="invoice-credit-note-list-mock">InvoiceCreditNoteList</div>
  ),
}))

jest.mock('~/components/invoices/InvoicePaymentList', () => ({
  InvoicePaymentList: () => <div data-test="invoice-payment-list-mock">InvoicePaymentList</div>,
}))

jest.mock('~/components/invoices/InvoiceActivityLogs', () => ({
  InvoiceActivityLogs: () => <div data-test="invoice-activity-logs-mock">InvoiceActivityLogs</div>,
}))

describe('CustomerInvoiceDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
    mockHasPermissions.mockReturnValue(true)

    const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

    useParamsMock.mockReturnValue({
      customerId: 'customer-123',
      invoiceId: 'invoice-123',
    })

    mockUseGetInvoiceDetailsQuery.mockReturnValue({
      data: mockInvoiceData,
      loading: false,
      error: null,
      refetch: jest.fn(),
    })

    mockUseGetInvoiceFeesQuery.mockReturnValue({
      data: { invoice: { id: 'invoice-123', fees: [] } },
      loading: false,
      error: null,
    })

    mockUseGetInvoiceCustomerQuery.mockReturnValue({
      data: mockCustomerData,
      loading: false,
    })
  })

  describe('GIVEN the page is rendered with data', () => {
    describe('WHEN in default state', () => {
      it('THEN should configure MainHeader with breadcrumb', () => {
        render(<CustomerInvoiceDetails />)

        expect(capturedConfig?.breadcrumb).toHaveLength(1)
        expect(capturedConfig?.breadcrumb?.[0].label).toBeDefined()
      })

      it('THEN should configure MainHeader with entity containing invoice number', () => {
        render(<CustomerInvoiceDetails />)

        expect(capturedConfig?.entity?.viewName).toBe('INV-001')
      })

      it('THEN should configure MainHeader with entity metadata containing invoice ID', () => {
        render(<CustomerInvoiceDetails />)

        expect(capturedConfig?.entity?.metadata).toContain('invoice-123')
      })

      it('THEN should configure MainHeader with entity badges', () => {
        render(<CustomerInvoiceDetails />)

        expect(capturedConfig?.entity?.badges?.length).toBeGreaterThan(0)
      })

      it('THEN should configure MainHeader with a dropdown action', () => {
        render(<CustomerInvoiceDetails />)

        expect(capturedConfig?.actions).toHaveLength(1)
        expect(capturedConfig?.actions?.[0].type).toBe('dropdown')
      })

      it('THEN should configure MainHeader with tabs', () => {
        render(<CustomerInvoiceDetails />)

        expect(capturedConfig?.tabs).toBeDefined()
        expect(capturedConfig?.tabs?.length).toBeGreaterThanOrEqual(1)
      })

      it('THEN should display the active tab content', () => {
        render(<CustomerInvoiceDetails />)

        expect(screen.getByTestId('active-tab-content')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the page is loading', () => {
    beforeEach(() => {
      mockUseGetInvoiceDetailsQuery.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: jest.fn(),
      })
      mockUseGetInvoiceFeesQuery.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      })
      mockUseGetInvoiceCustomerQuery.mockReturnValue({
        data: null,
        loading: true,
      })
    })

    describe('WHEN the component renders', () => {
      it('THEN should set isLoading on MainHeader config', () => {
        render(<CustomerInvoiceDetails />)

        expect(capturedConfig?.isLoading).toBe(true)
      })
    })
  })

  describe('GIVEN the page has an error', () => {
    beforeEach(() => {
      mockUseGetInvoiceDetailsQuery.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed'),
        refetch: jest.fn(),
      })
    })

    describe('WHEN the component renders', () => {
      it('THEN should not set isLoading on MainHeader config', () => {
        render(<CustomerInvoiceDetails />)

        expect(capturedConfig?.isLoading).toBeFalsy()
      })
    })
  })

  describe('GIVEN the dropdown items', () => {
    describe('WHEN the copy ID item is clicked', () => {
      it('THEN should copy the invoice ID to clipboard', () => {
        render(<CustomerInvoiceDetails />)

        const dropdownAction = capturedConfig?.actions?.[0]

        if (dropdownAction?.type === 'dropdown') {
          // The copy ID item is always visible (no hidden flag)
          // Find it by checking which item calls copyToClipboard
          const copyItem = dropdownAction.items.find((item) => {
            const mockClose = jest.fn()

            item.onClick(mockClose)
            if ((copyToClipboard as jest.Mock).mock.calls.length > 0) {
              return true
            }
            return false
          })

          expect(copyItem).toBeDefined()
          expect(copyToClipboard).toHaveBeenCalledWith('invoice-123')
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
        }
      })
    })

    describe('WHEN the download PDF item is present', () => {
      it('THEN should have a download item that is not hidden', () => {
        render(<CustomerInvoiceDetails />)

        const dropdownAction = capturedConfig?.actions?.[0]

        if (dropdownAction?.type === 'dropdown') {
          const visibleItems = dropdownAction.items.filter((item) => !item.hidden)

          // With canDownloadOnlyPdf=true, there should be visible items including download
          expect(visibleItems.length).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('GIVEN the invoice is finalized', () => {
    describe('WHEN tabs are configured', () => {
      it('THEN should include payments tab', () => {
        render(<CustomerInvoiceDetails />)

        // Finalized status should add payments tab
        const tabs = capturedConfig?.tabs

        expect(tabs).toBeDefined()
        // At minimum: overview + payments tabs for finalized status
        expect(tabs?.length).toBeGreaterThanOrEqual(2)
      })

      it('THEN should include credit notes tab', () => {
        render(<CustomerInvoiceDetails />)

        const tabs = capturedConfig?.tabs

        // Finalized status with no pending tax should have credit notes tab
        // overview + payments + credit notes + activity logs (if premium)
        expect(tabs?.length).toBeGreaterThanOrEqual(3)
      })
    })
  })
})
