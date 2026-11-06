import { RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { INVOICE_DETAILS_TABLE_SUBSCRIPTION_TEST_ID } from '~/components/invoices/details/InvoiceDetailsTable'
import { INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID } from '~/components/invoices/productCatalog/InvoiceProductCatalogSection'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragment,
  CurrencyEnum,
  CustomerForInvoiceOverviewFragment,
  FeeDetailsForInvoiceOverviewFragment,
  InvoiceProductCatalogContractFragment,
  InvoiceStatusTypeEnum,
  ProductTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import InvoiceOverview, {
  ANROK_RESYNC_CTA_TEST_ID,
  ANROK_SECTION_TEST_ID,
  AVALARA_RESYNC_CTA_TEST_ID,
  AVALARA_SECTION_TEST_ID,
} from '~/pages/InvoiceOverview'
import { render } from '~/test-utils'

// Stub the heavy children of the overview: they pull drawer/dialog stacks relying on the
// Vite-only `import.meta`, which jest cannot parse. The tax-provider rows under test live
// in InvoiceOverview itself.
jest.mock('~/components/invoices/details/ViewFeeDetailsDrawer', () => ({
  ViewFeeDetailsDrawerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useViewFeeDetailsDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/components/invoices/details/editFeeDrawer/useEditFeeDrawer', () => ({
  useEditFeeDrawer: () => ({ openDrawer: jest.fn() }),
}))

jest.mock('~/components/invoices/details/InvoiceDetailsTable', () => ({
  INVOICE_DETAILS_TABLE_SUBSCRIPTION_TEST_ID: 'invoice-details-subscription-table',
  InvoiceDetailsTable: () => <div data-test="invoice-details-subscription-table" />,
  InvoiceTableSection: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('~/components/invoices/InvoiceOverviewHeaderButtons', () => ({
  InvoiceOverviewHeaderButtons: () => null,
}))

jest.mock('~/components/invoices/InvoiceCustomerInfos', () => ({
  InvoiceCustomerInfos: () => null,
}))

jest.mock('~/components/invoices/Metadatas', () => ({
  Metadatas: () => null,
}))

jest.mock('~/components/invoices/productCatalog/InvoiceProductCatalogSection', () => ({
  INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID: 'invoice-product-catalog-section',
  InvoiceProductCatalogSection: () => <section data-test="invoice-product-catalog-section" />,
}))

const ANROK_CUSTOMER = { id: 'anrok-customer-1', externalAccountId: null }
const AVALARA_CUSTOMER = { id: 'avalara-customer-1', externalCustomerId: null }

const buildCustomer = (
  overrides: Partial<CustomerForInvoiceOverviewFragment>,
): CustomerForInvoiceOverviewFragment =>
  ({
    id: 'customer-1',
    applicableTimezone: TimezoneEnum.TzUtc,
    anrokCustomer: null,
    avalaraCustomer: null,
    xeroCustomer: null,
    hubspotCustomer: null,
    salesforceCustomer: null,
    ...overrides,
  }) as CustomerForInvoiceOverviewFragment

const buildVoidedInvoice = (): AllInvoiceDetailsForCustomerInvoiceDetailsFragment =>
  ({
    id: 'invoice-1',
    currency: CurrencyEnum.Usd,
    number: 'INV-001',
    totalAmountCents: '1000',
    versionNumber: 4,
    appliedTaxes: [] as AllInvoiceDetailsForCustomerInvoiceDetailsFragment['appliedTaxes'],
    status: InvoiceStatusTypeEnum.Voided,
    taxProviderVoidable: true,
    taxProviderId: null,
    externalIntegrationId: null,
  }) as AllInvoiceDetailsForCustomerInvoiceDetailsFragment

const FEES = [{ id: 'fee-1' }] as FeeDetailsForInvoiceOverviewFragment[]

const noop = jest.fn()

const renderOverview = ({
  customer,
  retryTaxProviderVoiding = noop,
  productCatalogContracts = null,
  fees = FEES,
}: {
  customer: CustomerForInvoiceOverviewFragment
  retryTaxProviderVoiding?: jest.Mock
  productCatalogContracts?: InvoiceProductCatalogContractFragment[] | null
  fees?: FeeDetailsForInvoiceOverviewFragment[]
}): RenderResult =>
  render(
    <InvoiceOverview
      customer={customer}
      invoice={buildVoidedInvoice()}
      fees={fees}
      productCatalogContracts={productCatalogContracts}
      hasError={false}
      hasTaxProviderError={false}
      canRetryInvoice={false}
      loading={false}
      loadingInvoiceDownload={false}
      loadingInvoiceXmlDownload={false}
      loadingRefreshInvoice={false}
      loadingRetryInvoice={false}
      loadingRetryTaxProviderVoiding={false}
      loadingSyncHubspotIntegrationInvoice={false}
      loadingSyncSalesforceIntegrationInvoice={false}
      downloadInvoice={noop}
      downloadInvoiceXml={noop}
      refreshInvoice={noop}
      retryInvoice={noop}
      retryTaxProviderVoiding={retryTaxProviderVoiding}
      syncHubspotIntegrationInvoice={noop}
      syncSalesforceIntegrationInvoice={noop}
      connectedNetsuiteIntegration={undefined}
      connectedHubspotIntegration={undefined}
      connectedSalesforceIntegration={undefined}
      connectedAvalaraIntegration={undefined}
    />,
    { useParams: { invoiceId: 'invoice-1' } },
  )

describe('InvoiceOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a voided invoice with an outstanding tax-provider voiding error', () => {
    describe('WHEN the customer is connected to Anrok only', () => {
      it.each([
        ['Anrok row', ANROK_SECTION_TEST_ID],
        ['Anrok re-sync call to action', ANROK_RESYNC_CTA_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        renderOverview({ customer: buildCustomer({ anrokCustomer: ANROK_CUSTOMER }) })

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it.each([
        ['Avalara row', AVALARA_SECTION_TEST_ID],
        ['Avalara re-sync call to action', AVALARA_RESYNC_CTA_TEST_ID],
      ])('THEN should not display the %s', (_, testId) => {
        renderOverview({ customer: buildCustomer({ anrokCustomer: ANROK_CUSTOMER }) })

        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the customer is connected to Avalara only', () => {
      it.each([
        ['Avalara row', AVALARA_SECTION_TEST_ID],
        ['Avalara re-sync call to action', AVALARA_RESYNC_CTA_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        renderOverview({ customer: buildCustomer({ avalaraCustomer: AVALARA_CUSTOMER }) })

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it.each([
        ['Anrok row', ANROK_SECTION_TEST_ID],
        ['Anrok re-sync call to action', ANROK_RESYNC_CTA_TEST_ID],
      ])('THEN should not display the %s', (_, testId) => {
        renderOverview({ customer: buildCustomer({ avalaraCustomer: AVALARA_CUSTOMER }) })

        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the customer is connected to both tax providers', () => {
      it.each([
        ['Anrok re-sync call to action', ANROK_RESYNC_CTA_TEST_ID],
        ['Avalara re-sync call to action', AVALARA_RESYNC_CTA_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        renderOverview({
          customer: buildCustomer({
            anrokCustomer: ANROK_CUSTOMER,
            avalaraCustomer: AVALARA_CUSTOMER,
          }),
        })

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })
    })

    describe('WHEN the customer is connected to no tax provider', () => {
      it.each([
        ['Anrok row', ANROK_SECTION_TEST_ID],
        ['Avalara row', AVALARA_SECTION_TEST_ID],
      ])('THEN should not display the %s', (_, testId) => {
        renderOverview({ customer: buildCustomer({}) })

        expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking the re-sync call to action of the connected tax provider', () => {
      it('THEN should trigger the tax-provider voiding retry', async () => {
        const user = userEvent.setup()
        const retryTaxProviderVoiding = jest.fn()

        renderOverview({
          customer: buildCustomer({ anrokCustomer: ANROK_CUSTOMER }),
          retryTaxProviderVoiding,
        })

        await user.click(screen.getByTestId(ANROK_RESYNC_CTA_TEST_ID))

        expect(retryTaxProviderVoiding).toHaveBeenCalledTimes(1)
      })
    })
  })
  describe('GIVEN a catalog invoice', () => {
    const contracts: InvoiceProductCatalogContractFragment[] = [
      { contract: { id: 'empty-contract' }, productCatalogSections: [] },
      {
        contract: { id: 'billed-contract' },
        productCatalogSections: [
          {
            productCategory: null,
            products: [
              {
                product: {
                  id: 'product-1',
                  name: 'Product',
                  code: 'product',
                  productType: ProductTypeEnum.Fixed,
                },
                amountCents: '1000',
                feesCount: 1,
                filters: [],
              },
            ],
          },
        ],
      },
    ]

    it('THEN renders the totals before the catalog section and hides the V1 table', () => {
      const { container } = renderOverview({
        customer: buildCustomer({}),
        productCatalogContracts: contracts,
        fees: [],
      })
      const section = screen.getByTestId(INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID)

      expect(
        screen.queryByTestId(INVOICE_DETAILS_TABLE_SUBSCRIPTION_TEST_ID),
      ).not.toBeInTheDocument()
      const footer = container.querySelector('tfoot')

      expect(footer).toBeInTheDocument()
      expect(footer?.compareDocumentPosition(section)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })

    it.each([
      [ANROK_SECTION_TEST_ID, { anrokCustomer: ANROK_CUSTOMER }],
      [AVALARA_SECTION_TEST_ID, { avalaraCustomer: AVALARA_CUSTOMER }],
    ])('THEN preserves %s using fees from any contract', (testId, customer) => {
      renderOverview({
        customer: buildCustomer(customer),
        productCatalogContracts: contracts,
        fees: [],
      })
      expect(screen.getByTestId(testId)).toBeInTheDocument()
    })

    it('THEN hides both providers for an empty catalog even if stale V1 fees exist', () => {
      renderOverview({
        customer: buildCustomer({
          anrokCustomer: ANROK_CUSTOMER,
          avalaraCustomer: AVALARA_CUSTOMER,
        }),
        productCatalogContracts: [],
        fees: FEES,
      })
      expect(screen.queryByTestId(ANROK_SECTION_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(AVALARA_SECTION_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN keeps the V1 table and fee presence check when catalog data is null', () => {
      renderOverview({
        customer: buildCustomer({ anrokCustomer: ANROK_CUSTOMER }),
        productCatalogContracts: null,
        fees: [],
      })
      expect(screen.getByTestId(INVOICE_DETAILS_TABLE_SUBSCRIPTION_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(INVOICE_PRODUCT_CATALOG_SECTION_TEST_ID)).not.toBeInTheDocument()
      expect(screen.queryByTestId(ANROK_SECTION_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
