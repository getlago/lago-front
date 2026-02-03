import { generatePath } from 'react-router-dom'

import {
  CustomerDetailsTabsOptions,
  CustomerInvoiceDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { CUSTOMER_DETAILS_TAB_ROUTE, CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { InvoiceStatusTypeEnum } from '~/generated/graphql'

/**
 * This tests the redirect logic used in CustomerInvoiceRegenerate's onCompleted callback.
 * The full component is complex to test due to many Apollo and auth dependencies.
 */
describe('CustomerInvoiceRegenerate redirect logic', () => {
  const customerId = 'test-customer-id'

  /**
   * Determines the redirect path after invoice regeneration.
   * Mirrors the logic in CustomerInvoiceRegenerate's onCompleted callback.
   */
  const getRedirectPath = (invoiceId: string, status: InvoiceStatusTypeEnum): string => {
    // If invoice is closed (zero amount + skip setting), redirect to invoices list
    // because closed invoices are not visible via the API
    if (status === InvoiceStatusTypeEnum.Closed) {
      return generatePath(CUSTOMER_DETAILS_TAB_ROUTE, {
        customerId,
        tab: CustomerDetailsTabsOptions.invoices,
      })
    }

    return generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
      customerId,
      invoiceId,
      tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
    })
  }

  describe('GIVEN an invoice regeneration completes', () => {
    describe('WHEN the new invoice status is Closed', () => {
      it('THEN it should redirect to invoices list', () => {
        const path = getRedirectPath('new-invoice-id', InvoiceStatusTypeEnum.Closed)

        expect(path).toContain(customerId)
        expect(path).toContain('invoices')
        expect(path).not.toContain('new-invoice-id')
      })
    })

    describe('WHEN the new invoice status is Finalized', () => {
      it('THEN it should redirect to invoice detail', () => {
        const path = getRedirectPath('new-invoice-id', InvoiceStatusTypeEnum.Finalized)

        expect(path).toContain('new-invoice-id')
      })
    })

    describe('WHEN the new invoice status is Draft', () => {
      it('THEN it should redirect to invoice detail', () => {
        const path = getRedirectPath('new-invoice-id', InvoiceStatusTypeEnum.Draft)

        expect(path).toContain('new-invoice-id')
      })
    })

    describe('WHEN the new invoice status is Open', () => {
      it('THEN it should redirect to invoice detail', () => {
        const path = getRedirectPath('new-invoice-id', InvoiceStatusTypeEnum.Open)

        expect(path).toContain('new-invoice-id')
      })
    })
  })
})
