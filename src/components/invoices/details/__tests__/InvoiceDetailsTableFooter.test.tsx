import { screen } from '@testing-library/react'

import {
  CREDIT_ROW_GRANTED_TEST_ID,
  CREDIT_ROW_LEGACY_TEST_ID,
  CREDIT_ROW_PURCHASED_TEST_ID,
  InvoiceDetailsTableFooter,
} from '~/components/invoices/details/InvoiceDetailsTableFooter'
import {
  CurrencyEnum,
  InvoiceForDetailsTableFooterFragment,
  InvoiceStatusTypeEnum,
  InvoiceTypeEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

const createMockInvoice = (
  overrides: Partial<InvoiceForDetailsTableFooterFragment> = {},
): InvoiceForDetailsTableFooterFragment => ({
  couponsAmountCents: '0',
  creditNotesAmountCents: '0',
  subTotalExcludingTaxesAmountCents: '10000',
  subTotalIncludingTaxesAmountCents: '11000',
  totalAmountCents: '11000',
  totalDueAmountCents: '11000',
  totalSettledAmountCents: '0',
  currency: CurrencyEnum.Usd,
  invoiceType: InvoiceTypeEnum.Subscription,
  status: InvoiceStatusTypeEnum.Finalized,
  taxStatus: null,
  prepaidCreditAmountCents: '0',
  prepaidGrantedCreditAmountCents: null,
  prepaidPurchasedCreditAmountCents: null,
  progressiveBillingCreditAmountCents: '0',
  versionNumber: 4,
  appliedTaxes: [],
  ...overrides,
})

const renderFooter = (invoice: InvoiceForDetailsTableFooterFragment) => {
  return render(
    <table>
      <InvoiceDetailsTableFooter canHaveUnitPrice={false} invoice={invoice} />
    </table>,
  )
}

describe('InvoiceDetailsTableFooter', () => {
  describe('GIVEN the invoice has prepaid credit rows', () => {
    describe('WHEN both granted and purchased credit amounts are present', () => {
      it('THEN should display both granted and purchased credit rows', () => {
        const invoice = createMockInvoice({
          prepaidGrantedCreditAmountCents: '5000',
          prepaidPurchasedCreditAmountCents: '3000',
        })

        renderFooter(invoice)

        expect(screen.getByTestId(CREDIT_ROW_GRANTED_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(CREDIT_ROW_PURCHASED_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_LEGACY_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN only granted credit amount is present', () => {
      it('THEN should display only the granted credit row', () => {
        const invoice = createMockInvoice({
          prepaidGrantedCreditAmountCents: '5000',
          prepaidPurchasedCreditAmountCents: null,
        })

        renderFooter(invoice)

        expect(screen.getByTestId(CREDIT_ROW_GRANTED_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_PURCHASED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_LEGACY_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN only purchased credit amount is present', () => {
      it('THEN should display only the purchased credit row', () => {
        const invoice = createMockInvoice({
          prepaidPurchasedCreditAmountCents: '3000',
          prepaidGrantedCreditAmountCents: null,
        })

        renderFooter(invoice)

        expect(screen.queryByTestId(CREDIT_ROW_GRANTED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(CREDIT_ROW_PURCHASED_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_LEGACY_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN neither granted nor purchased but legacy prepaid credit is present', () => {
      it('THEN should display the legacy prepaid credit row', () => {
        const invoice = createMockInvoice({
          prepaidCreditAmountCents: '8000',
          prepaidGrantedCreditAmountCents: null,
          prepaidPurchasedCreditAmountCents: null,
        })

        renderFooter(invoice)

        expect(screen.queryByTestId(CREDIT_ROW_GRANTED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_PURCHASED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(CREDIT_ROW_LEGACY_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the invoice is a draft', () => {
      it('THEN should not display any prepaid credit rows', () => {
        const invoice = createMockInvoice({
          status: InvoiceStatusTypeEnum.Draft,
          prepaidCreditAmountCents: '8000',
          prepaidGrantedCreditAmountCents: '5000',
          prepaidPurchasedCreditAmountCents: '3000',
        })

        renderFooter(invoice)

        expect(screen.queryByTestId(CREDIT_ROW_GRANTED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_PURCHASED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_LEGACY_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN hideDiscounts is true', () => {
      it('THEN should not display any prepaid credit rows', () => {
        const invoice = createMockInvoice({
          prepaidCreditAmountCents: '8000',
          prepaidGrantedCreditAmountCents: '5000',
          prepaidPurchasedCreditAmountCents: '3000',
        })

        render(
          <table>
            <InvoiceDetailsTableFooter
              canHaveUnitPrice={false}
              invoice={invoice}
              hideDiscounts={true}
            />
          </table>,
        )

        expect(screen.queryByTestId(CREDIT_ROW_GRANTED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_PURCHASED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_LEGACY_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN no credit amounts exist', () => {
      it('THEN should not display any credit rows', () => {
        const invoice = createMockInvoice({
          prepaidCreditAmountCents: '0',
          prepaidGrantedCreditAmountCents: null,
          prepaidPurchasedCreditAmountCents: null,
        })

        renderFooter(invoice)

        expect(screen.queryByTestId(CREDIT_ROW_GRANTED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_PURCHASED_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(CREDIT_ROW_LEGACY_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
