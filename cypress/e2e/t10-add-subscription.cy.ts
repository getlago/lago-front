import { DateTime } from 'luxon'

import { CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID } from '~/components/dialogs/const'
import {
  SUBSCRIPTION_DETAILS_ACTIONS_TEST_ID,
  SUBSCRIPTION_DETAILS_CANCEL_TEST_ID,
  SUBSCRIPTION_INFORMATION_FIELDS_TEST_ID,
} from '~/components/subscriptions/subscriptionTestIds'

import { customerName } from '../support/reusableConstants'

describe('Subscriptions', () => {
  beforeEach(() => {
    cy.login().visitApp('/customers')
    cy.get('[data-test="table-customers-list"] tr').contains(customerName).click()
  })

  const subscriptionName = `Subscription-${Math.round(Math.random() * 10000)}`
  const subscriptionAt = DateTime.now().plus({ days: 7 }).toISO()
  const inputFormattedDate = DateTime.fromISO(subscriptionAt as string).toFormat('LL/dd/yyyy')

  it('should be able to add a subscription in the future to customer', () => {
    cy.get(`[data-test="add-subscription"]`).click({ force: true })
    cy.url().should('include', '/create/subscription')

    // Submit without selecting a plan to show validation error
    cy.get('[data-test="submit"]').should('not.be.disabled').click()
    cy.get('input[name="planId"]').should('exist')

    // Select a plan from the combobox to show form sections
    cy.get('input[name="planId"]').click({ force: true })
    cy.get('[data-option-index="0"]', { timeout: 10000 }).click({ force: true })

    cy.get('[data-test="create-subscription-form-wrapper"]').within(() => {
      // Set subscription date
      cy.get('input[name="subscriptionAt"]')
        .clear({ force: true })
        .type(inputFormattedDate, { force: true })

      // Show and fill subscription name (hidden by default for new subscriptions)
      cy.get('[data-test="show-name"]').click()
      cy.get('input[name="name"]').first().type(subscriptionName)
    })

    cy.get('[data-test="submit"]').should('not.be.disabled').click()
    cy.get('[data-test="submit"]').should('not.exist')
    cy.get(`[data-test="${subscriptionName}"]`).should('exist')
  })

  it('should be able to cancel a future subscription', () => {
    cy.get(`[data-test="${subscriptionName}"]`).should('exist')
    cy.get(`[data-test="${subscriptionName}"]`).click({ force: true })

    cy.get(`[data-test="${SUBSCRIPTION_INFORMATION_FIELDS_TEST_ID}"]`)
      .should('contain.text', subscriptionName)
      .and('contain.text', 'Pending')

    cy.location('pathname').then((pathname) => {
      const subscriptionPath = pathname.replace(/^\/[^/]+/, '')

      cy.intercept('POST', '**/graphql', (request) => {
        if (request.body.operationName === 'terminateCustomerSubscription') {
          request.alias = 'cancelSubscription'
        }
      })

      cy.get(`[data-test="${SUBSCRIPTION_DETAILS_ACTIONS_TEST_ID}"]`).click()
      cy.get(`[data-test="${SUBSCRIPTION_DETAILS_CANCEL_TEST_ID}"]`).click()
      cy.get(`[data-test="${CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID}"]`).click()

      cy.wait('@cancelSubscription')
        .its('response.body.data.terminateSubscription.status')
        .should('eq', 'canceled')
      cy.location('pathname').should('match', /^\/[^/]+\/customer\/[^/]+$/)

      cy.visitApp(subscriptionPath)
      cy.get(`[data-test="${SUBSCRIPTION_INFORMATION_FIELDS_TEST_ID}"]`)
        .should('contain.text', subscriptionName)
        .and('contain.text', 'Canceled')

      cy.intercept('POST', '**/graphql', (request) => {
        if (request.body.operationName === 'getSubscriptionForDetails') {
          request.alias = 'reloadedSubscription'
        }
      })
      cy.reload()
      cy.wait('@reloadedSubscription')
        .its('response.body.data.subscription')
        .should('include', { name: subscriptionName, status: 'canceled' })
      cy.get(`[data-test="${SUBSCRIPTION_INFORMATION_FIELDS_TEST_ID}"]`)
        .should('contain.text', subscriptionName)
        .and('contain.text', 'Canceled')
    })
  })
})
