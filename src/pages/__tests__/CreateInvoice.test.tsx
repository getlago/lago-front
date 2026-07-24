import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CurrencyEnum,
  CustomerAccountTypeEnum,
  TaxInfosForCreateInvoiceFragment,
  useCreateInvoiceMutation,
  useGetInfosForCreateInvoiceQuery,
} from '~/generated/graphql'
import { FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID } from '~/pages/createInvoice/components/FeesSection'
import { useInvoiceBuildRegenerationPreview } from '~/pages/invoiceDetails/common/useInvoiceBuildRegenerationPreview'
import { render } from '~/test-utils'

import CreateInvoice, {
  computeHasTaxProvider,
  CREATE_INVOICE_SUBMIT_BUTTON_TEST_ID,
  resolveCustomerApplicableTax,
} from '../CreateInvoice'

jest.mock('~/pages/invoiceDetails/common/useInvoiceBuildRegenerationPreview', () => ({
  useInvoiceBuildRegenerationPreview: jest.fn(),
}))

// drawerStack relies on import.meta, which jest cannot parse
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/core/useLocationHistory', () => ({
  useLocationHistory: () => ({ goBack: jest.fn() }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasFeatureFlag: jest.fn(() => false),
    organization: undefined,
    loading: false,
    timezone: 'UTC',
  }),
}))

jest.mock('~/hooks/usePermissionsInvoiceActions', () => ({
  usePermissionsInvoiceActions: () => ({
    canVoid: jest.fn(() => false),
    canCreate: jest.fn(() => true),
  }),
}))

jest.mock('~/hooks/useIframeConfig', () => ({
  useIframeConfig: () => ({
    isRunningInIframeContext: false,
    isRunningInSalesForceIframe: false,
    emitIframeMessage: jest.fn(),
    emitSalesForceEvent: jest.fn(),
  }),
}))

jest.mock('~/generated/graphql', () => {
  const actual = jest.requireActual('~/generated/graphql')

  return {
    ...actual,
    useGetInfosForCreateInvoiceQuery: jest.fn(() => ({
      data: undefined,
      loading: true,
      error: undefined,
    })),
    useGetBillingEntityQuery: jest.fn(() => ({
      data: undefined,
      loading: false,
    })),
    useGetBillingEntityTaxesForCreateInvoiceQuery: jest.fn(() => ({
      data: undefined,
      loading: false,
    })),
    useGetAddonListForInfoiceLazyQuery: jest.fn(() => [
      jest.fn(),
      { data: undefined, loading: false },
    ]),
    useFetchDraftInvoiceTaxesMutation: jest.fn(() => [jest.fn(), {}]),
    useCreateInvoiceMutation: jest.fn(() => [jest.fn(), {}]),
    useVoidInvoiceMutation: jest.fn(() => [jest.fn(), {}]),
  }
})

jest.mock('~/components/designSystem/WarningDialog', () => ({
  WarningDialog: jest.fn(() => null),
}))

jest.mock('~/components/invoices/EditFeeBillingPeriod', () => ({
  useEditFeeBillingPeriodDialog: () => ({
    openEditFeeBillingPeriodDialog: jest.fn(),
  }),
}))

jest.mock('~/components/invoices/useEditInvoiceDisplayName', () => ({
  useEditInvoiceDisplayNameDialog: () => ({
    openEditInvoiceDisplayNameDialog: jest.fn(),
  }),
}))

jest.mock('~/components/invoices/EditInvoiceItemDescriptionDialog', () => ({
  useEditInvoiceItemDescriptionDialog: () => ({
    openEditInvoiceItemDescriptionDialog: jest.fn(),
  }),
}))

jest.mock('~/components/invoices/EditInvoiceItemTaxDialog', () => ({
  useEditInvoiceItemTaxDialog: () => ({
    openEditInvoiceItemTaxDialog: jest.fn(),
  }),
}))

const mockUseInvoiceBuildRegenerationPreview = useInvoiceBuildRegenerationPreview as jest.Mock

// -- Test data --

const orgTax: TaxInfosForCreateInvoiceFragment = {
  id: 'org-tax-1',
  name: 'Org VAT',
  code: 'org_vat',
  rate: 20,
}
const customerTax: TaxInfosForCreateInvoiceFragment = {
  id: 'cust-tax-1',
  name: 'Customer Tax',
  code: 'cust_tax',
  rate: 10,
}
const billingEntityTax: TaxInfosForCreateInvoiceFragment = {
  id: 'be-tax-1',
  name: 'BE Tax',
  code: 'be_tax',
  rate: 15,
}

// -- Tests --

describe('CreateInvoice tax resolution logic', () => {
  describe('computeHasTaxProvider', () => {
    describe('GIVEN a customer with an Anrok integration', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return true', () => {
          const result = computeHasTaxProvider({
            anrokCustomer: { id: 'anrok-1' },
            avalaraCustomer: null,
          })

          expect(result).toBe(true)
        })
      })
    })

    describe('GIVEN a customer with an Avalara integration', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return true', () => {
          const result = computeHasTaxProvider({
            anrokCustomer: null,
            avalaraCustomer: { id: 'avalara-1' },
          })

          expect(result).toBe(true)
        })
      })
    })

    describe('GIVEN a customer with both Anrok and Avalara integrations', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return true', () => {
          const result = computeHasTaxProvider({
            anrokCustomer: { id: 'anrok-1' },
            avalaraCustomer: { id: 'avalara-1' },
          })

          expect(result).toBe(true)
        })
      })
    })

    describe('GIVEN a customer with no tax provider', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return false', () => {
          const result = computeHasTaxProvider({
            anrokCustomer: null,
            avalaraCustomer: null,
          })

          expect(result).toBe(false)
        })
      })
    })

    describe('GIVEN no customer data', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return false', () => {
          expect(computeHasTaxProvider(undefined)).toBe(false)
          expect(computeHasTaxProvider(null)).toBe(false)
        })
      })
    })
  })

  describe('resolveCustomerApplicableTax', () => {
    describe('GIVEN the customer has a tax provider (Anrok or Avalara)', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should return an empty array regardless of other taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: true,
            customerTaxes: [customerTax],
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([])
        })
      })
    })

    describe('GIVEN no tax provider and the customer has taxes', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should return customer taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: [customerTax],
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([customerTax])
        })
      })
    })

    describe('GIVEN no tax provider, no customer taxes, but billing entity has taxes', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should return billing entity taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: null,
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([billingEntityTax])
        })
      })
    })

    describe('GIVEN no tax provider, no customer taxes, and empty billing entity taxes', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should fall back to org-level taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: [],
            billingEntityTaxes: [],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([orgTax])
        })
      })
    })

    describe('GIVEN no tax provider, no customer taxes, and no billing entity taxes', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should fall back to org-level taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: null,
            billingEntityTaxes: null,
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([orgTax])
        })
      })
    })

    describe('GIVEN no tax provider and no taxes at any level', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should return undefined', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: null,
            billingEntityTaxes: null,
            orgTaxes: undefined,
          })

          expect(result).toBeUndefined()
        })
      })
    })

    describe('GIVEN customer taxes take precedence over billing entity taxes', () => {
      describe('WHEN both customer and billing entity have taxes', () => {
        it('THEN should return customer taxes, not billing entity taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: [customerTax],
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([customerTax])
          expect(result).not.toEqual([billingEntityTax])
        })
      })
    })

    describe('GIVEN billing entity taxes take precedence over org taxes', () => {
      describe('WHEN billing entity has taxes but customer does not', () => {
        it('THEN should return billing entity taxes, not org taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: null,
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([billingEntityTax])
          expect(result).not.toEqual([orgTax])
        })
      })
    })
  })
})

describe('CreateInvoice - form behavior', () => {
  const mockCreateInvoice = jest.fn()

  const customerQueryData = {
    customer: {
      id: 'cus_1',
      externalId: 'ext_1',
      displayName: 'ACME Corp',
      name: 'ACME Corp',
      email: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      country: null,
      currency: CurrencyEnum.Eur,
      legalName: null,
      legalNumber: null,
      taxIdentificationNumber: null,
      state: null,
      zipcode: null,
      accountType: CustomerAccountTypeEnum.Customer,
      billingEntity: { id: 'be_1', code: 'main' },
      taxes: [],
      anrokCustomer: null,
      avalaraCustomer: null,
    },
    taxes: { collection: [] },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseInvoiceBuildRegenerationPreview.mockReturnValue({
      invoiceBuildRegenerationPreview: undefined,
      loading: false,
      error: undefined,
      data: undefined,
    })
    ;(useGetInfosForCreateInvoiceQuery as jest.Mock).mockReturnValue({
      data: customerQueryData,
      loading: false,
      error: undefined,
    })
    ;(useCreateInvoiceMutation as jest.Mock).mockReturnValue([mockCreateInvoice, {}])
  })

  describe('GIVEN the page is loaded with a customer', () => {
    describe('WHEN the form is pristine', () => {
      it('THEN should enable the submit button upfront', () => {
        render(<CreateInvoice />, { useParams: { customerId: 'cus_1' } })

        expect(screen.getByTestId(CREATE_INVOICE_SUBMIT_BUTTON_TEST_ID)).not.toBeDisabled()
      })

      it('THEN should not display the at-least-one-item error', () => {
        render(<CreateInvoice />, { useParams: { customerId: 'cus_1' } })

        expect(
          screen.queryByTestId(FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN submitting without any fee', () => {
      it('THEN should display the at-least-one-item error, disable the button and not create the invoice', async () => {
        const user = userEvent.setup()

        render(<CreateInvoice />, { useParams: { customerId: 'cus_1' } })

        await user.click(screen.getByTestId(CREATE_INVOICE_SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(
            screen.getByTestId(FEES_SECTION_AT_LEAST_ONE_FEE_ERROR_TEST_ID),
          ).toBeInTheDocument()
        })
        expect(screen.getByTestId(CREATE_INVOICE_SUBMIT_BUTTON_TEST_ID)).toBeDisabled()
        expect(mockCreateInvoice).not.toHaveBeenCalled()
      })
    })
  })
})

describe('CreateInvoice - hook integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseInvoiceBuildRegenerationPreview.mockReturnValue({
      invoiceBuildRegenerationPreview: undefined,
      loading: false,
      error: undefined,
      data: undefined,
    })
  })

  describe('GIVEN the page is rendered with URL params', () => {
    describe('WHEN a voidedInvoiceId is present in the URL', () => {
      it('THEN should call useInvoiceBuildRegenerationPreview with the voidedInvoiceId', () => {
        render(<CreateInvoice />, {
          useParams: { customerId: 'test-customer-id', voidedInvoiceId: 'voided-invoice-123' },
        })

        expect(mockUseInvoiceBuildRegenerationPreview).toHaveBeenCalledWith('voided-invoice-123')
      })
    })

    describe('WHEN no voidedInvoiceId is in the URL', () => {
      it('THEN should call useInvoiceBuildRegenerationPreview with an empty string', () => {
        render(<CreateInvoice />, {
          useParams: { customerId: 'test-customer-id' },
        })

        expect(mockUseInvoiceBuildRegenerationPreview).toHaveBeenCalledWith('')
      })
    })
  })
})
