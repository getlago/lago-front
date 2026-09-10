import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  INVOICE_OVERVIEW_DOWNLOAD_BUTTON_TEST_ID,
  INVOICE_OVERVIEW_FINALIZE_BUTTON_TEST_ID,
  INVOICE_OVERVIEW_REFRESH_BUTTON_TEST_ID,
  INVOICE_OVERVIEW_RETRY_BUTTON_TEST_ID,
  InvoiceOverviewHeaderButtons,
} from '~/components/invoices/InvoiceOverviewHeaderButtons'
import {
  AllInvoiceDetailsForCustomerInvoiceDetailsFragment,
  InvoiceStatusTypeEnum,
  InvoiceTaxStatusTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

const mockOpenFinalizeInvoiceDialog = jest.fn()

jest.mock('~/components/invoices/FinalizeInvoiceDialog', () => ({
  useFinalizeInvoiceDialog: () => ({
    openFinalizeInvoiceDialog: mockOpenFinalizeInvoiceDialog,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const createInvoice = (
  overrides: Record<string, unknown> = {},
): AllInvoiceDetailsForCustomerInvoiceDetailsFragment =>
  ({
    id: 'invoice-123',
    status: InvoiceStatusTypeEnum.Failed,
    taxStatus: InvoiceTaxStatusTypeEnum.Succeeded,
    billingEntity: { einvoicing: false },
    xmlUrl: null,
    ...overrides,
  }) as unknown as AllInvoiceDetailsForCustomerInvoiceDetailsFragment

const mockRefreshInvoice = jest.fn()
const mockRetryInvoice = jest.fn()
const mockDownloadInvoice = jest.fn()
const mockDownloadInvoiceXml = jest.fn()

const renderButtons = (
  props: Partial<React.ComponentProps<typeof InvoiceOverviewHeaderButtons>> = {},
) =>
  render(
    <InvoiceOverviewHeaderButtons
      invoice={createInvoice()}
      loading={false}
      loadingRefreshInvoice={false}
      loadingRetryInvoice={false}
      loadingInvoiceDownload={false}
      loadingInvoiceXmlDownload={false}
      hasError={false}
      canRetryInvoice={false}
      refreshInvoice={mockRefreshInvoice}
      retryInvoice={mockRetryInvoice}
      downloadInvoice={mockDownloadInvoice}
      downloadInvoiceXml={mockDownloadInvoiceXml}
      invoiceId="invoice-123"
      {...props}
    />,
  )

describe('InvoiceOverviewHeaderButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a draft invoice', () => {
    describe('WHEN the component renders', () => {
      it.each([
        ['refresh button', INVOICE_OVERVIEW_REFRESH_BUTTON_TEST_ID],
        ['finalize button', INVOICE_OVERVIEW_FINALIZE_BUTTON_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        renderButtons({ invoice: createInvoice({ status: InvoiceStatusTypeEnum.Draft }) })

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should not display the retry button even when the retry is authorized', () => {
        renderButtons({
          invoice: createInvoice({ status: InvoiceStatusTypeEnum.Draft }),
          canRetryInvoice: true,
        })

        expect(screen.queryByTestId(INVOICE_OVERVIEW_RETRY_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the retry is authorized', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the retry button', () => {
        renderButtons({ canRetryInvoice: true })

        expect(screen.getByTestId(INVOICE_OVERVIEW_RETRY_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should not display the download button', () => {
        renderButtons({ canRetryInvoice: true })

        expect(
          screen.queryByTestId(INVOICE_OVERVIEW_DOWNLOAD_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the retry button is clicked', () => {
      it('THEN should call the retry mutation', async () => {
        const user = userEvent.setup()

        renderButtons({ canRetryInvoice: true })

        await user.click(screen.getByTestId(INVOICE_OVERVIEW_RETRY_BUTTON_TEST_ID))

        expect(mockRetryInvoice).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the retry is not authorized', () => {
    describe('WHEN the invoice still carries a tax error on a non-failed status', () => {
      // Guards the 405 invalid_status: the tax errors of a retried invoice outlive its
      // failed status until the async tax job clears them.
      it('THEN should not display the retry button', () => {
        renderButtons({
          invoice: createInvoice({ status: InvoiceStatusTypeEnum.Pending }),
          canRetryInvoice: false,
        })

        expect(screen.queryByTestId(INVOICE_OVERVIEW_RETRY_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should fall through to the download button', () => {
        renderButtons({
          invoice: createInvoice({ status: InvoiceStatusTypeEnum.Pending }),
          canRetryInvoice: false,
        })

        expect(screen.getByTestId(INVOICE_OVERVIEW_DOWNLOAD_BUTTON_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the invoice query errored', () => {
    describe('WHEN the retry is not authorized', () => {
      it('THEN should render nothing', () => {
        renderButtons({ hasError: true })

        expect(
          screen.queryByTestId(INVOICE_OVERVIEW_DOWNLOAD_BUTTON_TEST_ID),
        ).not.toBeInTheDocument()
        expect(screen.queryByTestId(INVOICE_OVERVIEW_RETRY_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the tax status is pending', () => {
    describe('WHEN the retry is authorized', () => {
      it('THEN should disable the retry button', () => {
        renderButtons({
          invoice: createInvoice({ taxStatus: InvoiceTaxStatusTypeEnum.Pending }),
          canRetryInvoice: true,
        })

        expect(screen.getByTestId(INVOICE_OVERVIEW_RETRY_BUTTON_TEST_ID)).toBeDisabled()
      })
    })
  })
})
