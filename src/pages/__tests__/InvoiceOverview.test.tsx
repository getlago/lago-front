import { RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragment,
  CustomerForInvoiceOverviewFragment,
  FeeDetailsForInvoiceOverviewFragment,
  InvoiceStatusTypeEnum,
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

jest.mock('~/components/invoices/details/EditFeeDrawer', () => ({
  EditFeeDrawer: () => null,
}))

jest.mock('~/components/invoices/details/InvoiceDetailsTable', () => ({
  InvoiceDetailsTable: () => null,
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
}: {
  customer: CustomerForInvoiceOverviewFragment
  retryTaxProviderVoiding?: jest.Mock
}): RenderResult =>
  render(
    <InvoiceOverview
      customer={customer}
      invoice={buildVoidedInvoice()}
      fees={FEES}
      hasError={false}
      hasTaxProviderError={false}
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
})
