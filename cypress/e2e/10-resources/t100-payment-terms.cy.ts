import { CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID } from '~/components/dialogs/const'
import {
  PAYMENT_TERM_ADD_BUTTON_TEST_ID,
  PAYMENT_TERM_DELETE_BUTTON_TEST_ID,
  PAYMENT_TERM_EDIT_BUTTON_TEST_ID,
  PAYMENT_TERM_SETTINGS_ROW_TEST_ID,
} from '~/components/paymentTerms/dataTestConstants'
import { EDIT_PAYMENT_TERM_SUBMIT_BUTTON_TEST_ID } from '~/components/settings/invoices/EditPaymentTermDialog'
import { PaymentTermTypeEnum } from '~/generated/graphql'

import { customerName } from '../../support/reusableConstants'

type TermFields = { days?: string; dayOfMonth?: string; monthOffset?: string }

/**
 * One row per term type. A new term option is a new row here, never a new spec: the
 * billing-entity and customer flows below are both driven off this table.
 */
const TERM_CASES: Array<{ termType: PaymentTermTypeEnum; fields: TermFields; label: string }> = [
  { termType: PaymentTermTypeEnum.DueOnReceipt, fields: {}, label: 'Due on receipt' },
  { termType: PaymentTermTypeEnum.Net, fields: { days: '30' }, label: 'Net 30 days' },
  { termType: PaymentTermTypeEnum.EndOfMonth, fields: {}, label: 'End of month' },
  {
    termType: PaymentTermTypeEnum.NetEndOfMonth,
    fields: { days: '30' },
    label: '30 net days after end of month',
  },
  {
    termType: PaymentTermTypeEnum.DaysEndOfMonth,
    fields: { days: '45' },
    label: '45 days end of month',
  },
  {
    termType: PaymentTermTypeEnum.DayOfMonth,
    fields: { dayOfMonth: '15', monthOffset: '1' },
    label: '15 MFI, 1 month offset',
  },
]

const CUSTOMER_TERM_CASE = TERM_CASES[1]

const fillTermForm = ({
  termType,
  fields,
}: {
  termType: PaymentTermTypeEnum
  fields: TermFields
}) => {
  // The dialog opens its term-type combo box on entry, so the options are already listed.
  // Each option row carries the term type as its own `data-test`.
  cy.get('[data-test="form-dialog"]').should('exist')
  cy.get(`[data-test="${termType}"]`).click()

  Object.entries(fields).forEach(([name, value]) => {
    cy.get(`input[name="${name}"]`).clear().type(value)
  })

  cy.get(`[data-test="${EDIT_PAYMENT_TERM_SUBMIT_BUTTON_TEST_ID}"]`).click()
  cy.get('[data-test="form-dialog"]').should('not.exist')
}

const paymentTermRow = () => cy.get(`[data-test="${PAYMENT_TERM_SETTINGS_ROW_TEST_ID}"]`)

describe('Payment terms', () => {
  beforeEach(() => {
    cy.login()
  })

  describe('billing entity', () => {
    const visitInvoiceSettings = () => {
      // `/settings` redirects to the default billing entity once its query resolves.
      cy.visitApp('/settings')
      cy.url().should('include', '/billing-entity/')

      cy.url().then((url) => {
        const billingEntityCode = url.match(/billing-entity\/([^/]+)/)?.[1] as string

        cy.visitApp(`/settings/billing-entity/${billingEntityCode}/invoice-settings`)
        cy.url().should('match', /\/settings\/billing-entity\/[^/]+\/invoice-settings$/)
      })
    }

    TERM_CASES.forEach(({ termType, fields, label }) => {
      it(`should set a ${termType} term and show it on the row`, () => {
        visitInvoiceSettings()

        paymentTermRow().find(`[data-test="${PAYMENT_TERM_EDIT_BUTTON_TEST_ID}"]`).click()
        fillTermForm({ termType, fields })

        paymentTermRow().should('contain', label)
      })
    })
  })

  describe('customer', () => {
    const visitCustomerSettings = () => {
      cy.visitApp('/customers')
      cy.contains(customerName).click()
      cy.url().should('include', '/customer/')
      cy.get('button[role="tab"]').contains('Settings').click()
    }

    it('should override the billing entity term, then delete it to inherit again', () => {
      visitCustomerSettings()

      paymentTermRow().find(`[data-test="${PAYMENT_TERM_ADD_BUTTON_TEST_ID}"]`).click()
      fillTermForm(CUSTOMER_TERM_CASE)

      paymentTermRow()
        .should('contain', CUSTOMER_TERM_CASE.label)
        .and('not.contain', 'inherit from billing entity')

      paymentTermRow().find(`[data-test="${PAYMENT_TERM_DELETE_BUTTON_TEST_ID}"]`).click()
      cy.get(`[data-test="${CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID}"]`).click()

      paymentTermRow().should('contain', 'inherit from billing entity')
    })
  })
})
