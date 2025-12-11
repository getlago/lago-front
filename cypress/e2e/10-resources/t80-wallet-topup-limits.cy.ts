import {
  CREATE_CUSTOMER_DATA_TEST,
  SUBMIT_CUSTOMER_DATA_TEST,
} from '~/components/customers/utils/dataTestConstants'
import {
  ADD_MIN_MAX_AMOUNT_DATA_TEST,
  ADD_MIN_TOPUP_OPTION_DATA_TEST,
  CREATE_WALLET_DATA_TEST,
  IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
  INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST,
  RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
  RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST,
  SUBMIT_WALLET_DATA_TEST,
  WALLET_ACTIONS_DATA_TEST,
  WALLET_TOPUP_BUTTON_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'

describe('Wallet Top-Up Limits Switch Visibility', () => {
  const randomId = `wallet-test-${Math.round(Math.random() * 100000)}`
  const walletName = 'Test Wallet'
  const customerName = 'Customer wallet top-up limits'

  beforeEach(() => {
    cy.login()
  })

  describe('Scenario 1: Wallet Creation WITHOUT min/max limits', () => {
    it('should NOT show ignorePaidTopUpLimits switch when no limits are set', () => {
      // Create a customer first
      cy.visit('/customers')
      cy.get(`[data-test="${CREATE_CUSTOMER_DATA_TEST}"]`).click()
      cy.get('input[name="externalId"]').type(`${randomId}-no-limits`)
      cy.get('input[name="name"]').type(`${customerName} - No Limits`)
      cy.get(`[data-test="${SUBMIT_CUSTOMER_DATA_TEST}"]`).click()
      cy.url().should('include', '/customer/')

      // Navigate to create wallet
      cy.get('button[role="tab"]').contains('Wallet').click()
      cy.get(`[data-test="${CREATE_WALLET_DATA_TEST}"]`).click()
      cy.url().should('include', '/customer/')
      cy.url().should('include', '/wallet/create')

      // Fill wallet form WITHOUT min/max limits
      cy.get('input[name="name"]').type(`${walletName} No Limits`)
      cy.get('input[name="rateAmount"]').clear().type('1')

      // Test one-time top-up section
      cy.get('input[name="paidCredits"]').type('50')

      // Should see invoiceRequiresSuccessfulPayment switch
      cy.get(`[data-test="${INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`).should(
        'exist',
      )

      // Should NOT see ignorePaidTopUpLimits switch
      cy.get(`[data-test="${IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should('not.exist')

      // Clear the paid credits
      cy.get('input[name="paidCredits"]').clear()

      // Both switches should disappear
      cy.get(`[data-test="${INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`).should(
        'not.exist',
      )
    })

    it('should NOT show ignorePaidTopUpLimits switch in recurring rule when no limits are set', () => {
      // Navigate back to the same form
      cy.visit('/customers')
      cy.intercept('POST', '/graphql').as('searchCustomers')
      cy.get('div[data-test="search-customers"] input').type(`${randomId}-no-limits`)
      cy.wait('@searchCustomers')
      cy.get('table tbody tr', { timeout: 10000 }).should('have.length', 1)
      cy.get('table tbody tr').first().click()
      cy.get('button[role="tab"]', { timeout: 10000 }).contains('Wallet').click()
      cy.get(`[data-test="${CREATE_WALLET_DATA_TEST}"]`).click()

      // Fill wallet form WITHOUT min/max limits
      cy.get('input[name="name"]').type(`${walletName} No Limits Recurring`)
      cy.get('input[name="rateAmount"]').clear().type('1')

      // Add recurring rule
      cy.contains('button', 'Add a recurring top-up rule').click()

      // Select Fixed amount method
      cy.get('input[name="recurringTransactionRules.0.paidCredits"]').type('100')

      // Should see invoiceRequiresSuccessfulPayment switch
      cy.get(
        `[data-test="${RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`,
      ).should('exist')

      // Should NOT see ignorePaidTopUpLimits switch for recurring rule
      cy.get(`[data-test="${RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should(
        'not.exist',
      )

      // Clear the paid credits
      cy.get('input[name="recurringTransactionRules.0.paidCredits"]').clear()

      // Both switches should disappear
      cy.get(
        `[data-test="${RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`,
      ).should('not.exist')
    })
  })

  describe('Scenario 2: Wallet Creation WITH min/max limits', () => {
    it('should show BOTH switches when limits are set', () => {
      // Create a customer
      cy.visit('/customers')
      cy.get(`[data-test="${CREATE_CUSTOMER_DATA_TEST}"]`).click()
      cy.get('input[name="externalId"]').type(`${randomId}-with-limits`)
      cy.get('input[name="name"]').type(`${customerName} - With Limits`)
      cy.get(`[data-test="${SUBMIT_CUSTOMER_DATA_TEST}"]`).click()
      cy.url().should('include', '/customer/')

      // Navigate to create wallet
      cy.get('button[role="tab"]', { timeout: 10000 }).contains('Wallet').click()
      cy.get(`[data-test="${CREATE_WALLET_DATA_TEST}"]`).click()

      // Fill wallet form WITH min/max limits
      cy.get('input[name="name"]').type(`${walletName} With Limits`)
      cy.get('input[name="rateAmount"]').clear().type('1')

      // Set minimum per transaction
      cy.get(`[data-test="${ADD_MIN_MAX_AMOUNT_DATA_TEST}"]`).click()
      cy.get(`[data-test="${ADD_MIN_TOPUP_OPTION_DATA_TEST}"]`).click()
      cy.get('input[name="paidTopUpMinAmountCents"]').type('10')

      // Test one-time top-up section
      cy.get('input[name="paidCredits"]').type('50')

      // Should see BOTH switches
      cy.get(`[data-test="${INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`).should(
        'exist',
      )
      cy.get(`[data-test="${IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should('exist')

      // Clear the paid credits
      cy.get('input[name="paidCredits"]').clear()

      // Both switches should disappear
      cy.get(`[data-test="${INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`).should(
        'not.exist',
      )
      cy.get(`[data-test="${IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should('not.exist')
    })

    it('should show BOTH switches in recurring rule when limits are set', () => {
      // Navigate back to the same form
      cy.visit('/customers')
      cy.intercept('POST', '/graphql').as('searchCustomers')
      cy.get('div[data-test="search-customers"] input').type(`${randomId}-with-limits`)
      cy.wait('@searchCustomers')
      // A bit of a hack here, as after the search the table contain 3 items (loading) then only one (the result)
      cy.get('table tbody tr', { timeout: 10000 }).should('have.length', 1)
      cy.get('table tbody tr').first().click()
      cy.get('button[role="tab"]', { timeout: 10000 }).contains('Wallet').click()
      cy.get(`[data-test="${CREATE_WALLET_DATA_TEST}"]`).click()

      // Fill wallet form WITH min/max limits
      cy.get('input[name="name"]').type(`${walletName} With Limits Recurring`)
      cy.get('input[name="rateAmount"]').clear().type('1')

      // Set minimum per transaction
      cy.get(`[data-test="${ADD_MIN_MAX_AMOUNT_DATA_TEST}"]`).click()
      cy.get(`[data-test="${ADD_MIN_TOPUP_OPTION_DATA_TEST}"]`).click()
      cy.get('input[name="paidTopUpMinAmountCents"]').type('10')

      // Add recurring rule
      cy.contains('button', 'Add a recurring top-up rule').click()

      // Select Fixed amount method and enter paid credits
      cy.get('input[name="recurringTransactionRules.0.paidCredits"]').type('100')

      // Should see BOTH switches
      cy.get(
        `[data-test="${RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`,
      ).should('exist')
      cy.get(`[data-test="${RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should('exist')

      // Clear the paid credits
      cy.get('input[name="recurringTransactionRules.0.paidCredits"]').clear()

      // Both switches should disappear
      cy.get(
        `[data-test="${RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`,
      ).should('not.exist')
      cy.get(`[data-test="${RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should(
        'not.exist',
      )
    })
  })

  describe('Scenario 3: Top-Up Form for Wallet WITHOUT min/max limits', () => {
    it('should NOT show ignorePaidTopUpLimits switch in top-up form', () => {
      // Create customer and wallet WITHOUT limits
      cy.visit('/customers')
      cy.get(`[data-test="${CREATE_CUSTOMER_DATA_TEST}"]`).click()
      cy.get('input[name="externalId"]').type(`${randomId}-topup-no-limits`)
      cy.get('input[name="name"]').type(`${customerName} - TopUp No Limits`)
      cy.get(`[data-test="${SUBMIT_CUSTOMER_DATA_TEST}"]`).click()
      cy.url().should('include', '/customer/')

      // Create wallet WITHOUT limits
      cy.get('button[role="tab"]', { timeout: 10000 }).contains('Wallet').click()
      cy.get(`[data-test="${CREATE_WALLET_DATA_TEST}"]`).click()
      cy.get('input[name="name"]').type(`${walletName} For TopUp No Limits`)
      cy.get('input[name="rateAmount"]').clear().type('1')
      cy.get(`[data-test="${SUBMIT_WALLET_DATA_TEST}"]`).click()

      // make sure we're on the correct page
      cy.url().should('include', '/wallet/')

      // Click on the wallet actions button
      cy.get(`[data-test="${WALLET_ACTIONS_DATA_TEST}"]`, { timeout: 10000 }).click()

      // Click top-up button
      cy.get(`[data-test="${WALLET_TOPUP_BUTTON_DATA_TEST}"]`).click()
      cy.url().should('include', '/wallet/')
      cy.url().should('include', '/top-up')

      // Enter credits to purchase
      cy.get('input[name="paidCredits"]').type('50')

      // Should see invoiceRequiresSuccessfulPayment switch
      cy.get(`[data-test="${INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`).should(
        'exist',
      )

      // Should NOT see ignorePaidTopUpLimits switch
      cy.get(`[data-test="${IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should('not.exist')

      // Clear the paid credits
      cy.get('input[name="paidCredits"]').clear()

      // Switch should disappear
      cy.get(`[data-test="${INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`).should(
        'not.exist',
      )
    })
  })

  // describe('Scenario 4: Top-Up Form for Wallet WITH min/max limits', () => {
  //   it('should show BOTH switches in top-up form', () => {
  //     // Create customer and wallet WITH limits
  //     cy.visit('/customers')
  //     cy.get(`[data-test="${CREATE_CUSTOMER_DATA_TEST}"]`).click()
  //     cy.get('input[name="externalId"]').type(`${randomId}-topup-with-limits`)
  //     cy.get('input[name="name"]').type(`${customerName} - TopUp With Limits`)
  //     cy.get(`[data-test="${SUBMIT_CUSTOMER_DATA_TEST}"]`).click()
  //     cy.url().should('include', '/customer/')

  //     // Create wallet WITH limits
  //     cy.get('button[role="tab"]', { timeout: 20000 }).contains('Wallet').click()
  //     cy.get(`[data-test="${CREATE_WALLET_DATA_TEST}"]`).click()
  //     cy.get('input[name="name"]').type(`${walletName} For TopUp With Limits`)
  //     cy.get('input[name="rateAmount"]').clear().type('1')
  //     cy.get(`[data-test="${ADD_MIN_MAX_AMOUNT_DATA_TEST}"]`).click()
  //     cy.get(`[data-test="${ADD_MIN_TOPUP_OPTION_DATA_TEST}"]`).click()
  //     cy.get('input[name="paidTopUpMinAmountCents"]').type('10')
  //     cy.get(`[data-test="${SUBMIT_WALLET_DATA_TEST}"]`).click()

  //     // make sure we're on the correct page
  //     cy.url().should('include', '/wallet/')

  //     // Click on the wallet actions button
  //     cy.get(`[data-test="${WALLET_ACTIONS_DATA_TEST}"]`, { timeout: 10000 }).click()

  //     // Click top-up button
  //     cy.get(`[data-test="${WALLET_TOPUP_BUTTON_DATA_TEST}"]`).should('be.visible')
  //     cy.get(`[data-test="${WALLET_TOPUP_BUTTON_DATA_TEST}"]`, { timeout: 20000 }).click()
  //     cy.url().should('include', '/wallet/')
  //     cy.url().should('include', '/top-up')

  //     // Enter credits to purchase
  //     cy.get('input[name="paidCredits"]').type('50')

  //     // Should see BOTH switches
  //     cy.get(`[data-test="${INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`).should(
  //       'exist',
  //     )
  //     cy.get(`[data-test="${IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should('exist')

  //     // Clear the paid credits
  //     cy.get('input[name="paidCredits"]').clear()

  //     // Both switches should disappear
  //     cy.get(`[data-test="${INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST}"]`).should(
  //       'not.exist',
  //     )
  //     cy.get(`[data-test="${IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`).should('not.exist')
  //   })
  // })
})
