import { DateTime } from 'luxon'

import { customerName } from '../support/reusableConstants'

describe('Subscriptions', () => {
  beforeEach(() => {
    cy.login().visit('/customers')
    cy.get('[data-test="table-customers-list"] tr').contains(customerName).click()
  })

  const subscriptionName = `Subscription-${Math.round(Math.random() * 10000)}`
  const subscriptionAt = DateTime.now().plus({ days: 7 }).toISO()
  const inputFormattedDate = DateTime.fromISO(subscriptionAt as string).toFormat('LL/dd/yyyy')

  it('should be able to add a subscription in the future to customer', () => {
    cy.get(`[data-test="add-subscription"]`).click({ force: true })
    cy.url().should('include', '/create/subscription')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="planId"]').click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })

    cy.get('[data-test="create-subscription-form-wrapper"]').within(() => {
      cy.get('input[name="subscriptionAt"]')
        .clear({ force: true })
        .type(inputFormattedDate, { force: true })
      cy.get('input[name="name"]').clear({ force: true }).type(subscriptionName, { force: true })
    })
    cy.get('[data-test="submit"]').click({ force: true })
    cy.get('[data-test="submit"]').should('not.exist')
    cy.get(`[data-test="${subscriptionName}"]`).should('exist')
  })

  it('should be able to cancel a future subscription', () => {
    cy.get(`[data-test="${subscriptionName}"]`).should('exist')
    cy.get(`[data-test="${subscriptionName}"]`).click({ force: true })

    cy.get('[data-test="status"]').should('have.text', 'Pending')
    cy.get('[data-test="subscription-details-actions"]').click()
    cy.get('[data-test="subscription-details-terminate"]').click()

    cy.get(`[data-test="warning-confirm"]`).click({ force: true })
  })
})
