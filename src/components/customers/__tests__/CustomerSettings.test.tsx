import { act, cleanup, screen, waitFor } from '@testing-library/react'

import {
  CurrencyEnum,
  FinalizeZeroAmountInvoiceEnum,
  GetCustomerSettingsDocument,
} from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { CustomerSettings } from '../CustomerSettings'

const CUSTOMER_ID = 'customer-123'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ customerId: 'customer-123' }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: true,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: (permissions: string[]) => permissions.includes('customersUpdate'),
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      id: 'org-123',
      name: 'Test Organization',
      premiumIntegrations: ['auto_dunning'],
    },
  }),
}))

// Mock dialog components that use useParams() internally
// Using require('react').forwardRef inside each mock factory to avoid hoisting issues
jest.mock('~/components/customers/EditCustomerInvoiceGracePeriodDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditCustomerInvoiceGracePeriodDialog'
  return { EditCustomerInvoiceGracePeriodDialog: MockDialog }
})

jest.mock('~/components/customers/DeleteCustomerGracePeriodeDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'DeleteCustomerGracePeriodeDialog'
  return { DeleteCustomerGracePeriodeDialog: MockDialog }
})

jest.mock('~/components/customers/EditCustomerDocumentLocaleDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditCustomerDocumentLocaleDialog'
  return { EditCustomerDocumentLocaleDialog: MockDialog }
})

jest.mock('~/components/customers/DeleteCustomerDocumentLocaleDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'DeleteCustomerDocumentLocaleDialog'
  return { DeleteCustomerDocumentLocaleDialog: MockDialog }
})

jest.mock('~/components/customers/EditCustomerVatRateDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditCustomerVatRateDialog'
  return { EditCustomerVatRateDialog: MockDialog }
})

jest.mock('~/components/customers/DeleteCustomerVatRateDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'DeleteCustomerVatRateDialog'
  return { DeleteCustomerVatRateDialog: MockDialog }
})

jest.mock('~/components/customers/EditCustomerDunningCampaignDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditCustomerDunningCampaignDialog'
  return { EditCustomerDunningCampaignDialog: MockDialog }
})

jest.mock('~/components/customers/EditCustomerInvoiceCustomSectionsDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditCustomerInvoiceCustomSectionsDialog'
  return { EditCustomerInvoiceCustomSectionsDialog: MockDialog }
})

jest.mock('~/components/customers/settings/EditCustomerIssuingDatePolicyDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditCustomerIssuingDatePolicyDialog'
  return { EditCustomerIssuingDatePolicyDialog: MockDialog }
})

jest.mock('~/components/customers/DeleteCustomerFinalizeZeroAmountInvoiceDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'DeleteCustomerFinalizeZeroAmountInvoiceDialog'
  return { DeleteCustomerFinalizeZeroAmountInvoiceDialog: MockDialog }
})

jest.mock('~/components/customers/DeleteCustomerNetPaymentTermDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'DeleteOrganizationNetPaymentTermDialog'
  return { DeleteOrganizationNetPaymentTermDialog: MockDialog }
})

jest.mock('~/components/settings/invoices/EditNetPaymentTermDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditNetPaymentTermDialog'
  return { EditNetPaymentTermDialog: MockDialog }
})

jest.mock('~/components/settings/invoices/EditFinalizeZeroAmountInvoiceDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'EditFinalizeZeroAmountInvoiceDialog'
  return { EditFinalizeZeroAmountInvoiceDialog: MockDialog }
})

jest.mock('~/components/PremiumWarningDialog', () => {
  const React = jest.requireActual('react')
  const MockDialog = React.forwardRef(() => null)

  MockDialog.displayName = 'PremiumWarningDialog'
  return { PremiumWarningDialog: MockDialog }
})

const createCustomerSettingsMock = (overrides = {}) => ({
  request: {
    query: GetCustomerSettingsDocument,
    variables: { id: CUSTOMER_ID },
  },
  result: {
    data: {
      customer: {
        __typename: 'Customer',
        id: CUSTOMER_ID,
        externalId: 'ext-customer-123',
        name: 'Test Customer',
        displayName: 'Test Customer',
        invoiceGracePeriod: null,
        netPaymentTerm: null,
        finalizeZeroAmountInvoice: FinalizeZeroAmountInvoiceEnum.Inherit,
        currency: CurrencyEnum.Usd,
        excludeFromDunningCampaign: false,
        skipInvoiceCustomSections: false,
        hasOverwrittenInvoiceCustomSectionsSelection: false,
        configurableInvoiceCustomSections: [],
        appliedDunningCampaign: null,
        billingEntity: {
          __typename: 'BillingEntity',
          id: 'billing-entity-123',
          netPaymentTerm: 30,
          finalizeZeroAmountInvoice: true,
          billingConfiguration: {
            __typename: 'BillingEntityBillingConfiguration',
            id: 'billing-config-123',
            invoiceGracePeriod: 0,
            documentLocale: 'en',
            subscriptionInvoiceIssuingDateAdjustment: null,
            subscriptionInvoiceIssuingDateAnchor: null,
          },
          appliedDunningCampaign: null,
        },
        billingConfiguration: {
          __typename: 'CustomerBillingConfiguration',
          id: 'customer-billing-config-123',
          documentLocale: null,
          subscriptionInvoiceIssuingDateAdjustment: null,
          subscriptionInvoiceIssuingDateAnchor: null,
        },
        taxes: [],
        ...overrides,
      },
    },
  },
})

async function prepare({ mocks = [createCustomerSettingsMock()] }: { mocks?: TestMocksType } = {}) {
  await act(() =>
    render(<CustomerSettings customerId={CUSTOMER_ID} />, {
      mocks,
    }),
  )
}

describe('CustomerSettings', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading skeleton while fetching data', async () => {
      // Use a mock that never resolves to keep loading state
      const loadingMock = {
        request: {
          query: GetCustomerSettingsDocument,
          variables: { id: CUSTOMER_ID },
        },
        delay: Infinity,
        result: {
          data: null,
        },
      }

      render(<CustomerSettings customerId={CUSTOMER_ID} />, {
        mocks: [loadingMock],
      })

      // During loading, should not show the settings content
      expect(screen.queryByText('Document language')).not.toBeInTheDocument()
    })
  })

  describe('Rendering Settings Sections', () => {
    it('renders document language section', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText(/document language/i)).toBeInTheDocument()
      })
    })

    it('renders finalize empty invoice section', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText(/finalize empty invoices/i)).toBeInTheDocument()
      })
    })

    it('renders grace period section', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText(/grace period/i)).toBeInTheDocument()
      })
    })

    it('renders net payment term section', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByText(/net payment term/i)).toBeInTheDocument()
      })
    })

    it('renders tax section', async () => {
      await prepare()

      await waitFor(() => {
        // Use getAllByText since "tax" appears in multiple places (Tax rate, Tax objects, etc.)
        const taxElements = screen.getAllByText(/tax/i)

        expect(taxElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Action Buttons', () => {
    it('renders add vat rate button', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByTestId('add-vat-rate-button')).toBeInTheDocument()
      })
    })

    it('renders add issuing date policy button', async () => {
      await prepare()

      await waitFor(() => {
        expect(screen.getByTestId('add-issuing-date-policy-button')).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('shows error placeholder when query fails', async () => {
      const errorMock = {
        request: {
          query: GetCustomerSettingsDocument,
          variables: { id: CUSTOMER_ID },
        },
        error: new Error('Failed to fetch customer settings'),
      }

      await prepare({ mocks: [errorMock] })

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      })
    })
  })
})
