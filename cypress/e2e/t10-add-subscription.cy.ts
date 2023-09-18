import { DateTime } from 'luxon'

import { customerName } from '../support/reusableConstants'

describe('Subscritions', () => {
  beforeEach(() => {
    cy.visit('/customers')
    cy.get(`[data-test="${customerName}"]`).click()
  })

  const subscriptionName = `Subscription-${Math.round(Math.random() * 10000)}`
  const subscriptionAt = DateTime.now().plus({ days: 2 }).toISO()
  const inputFormatedDate = DateTime.fromISO(subscriptionAt as string).toFormat('LL/dd/yyyy')

  it('should be able to add a subscription in the future to customer', () => {
    cy.get(`[data-test="add-subscription"]`).click({ force: true })
    cy.url().should('include', '/create/subscription')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="planId"]').click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('[data-test="create-subscription-form-wrapper"]').within(() => {
      cy.get('input[name="name"]').clear().type(subscriptionName)
      cy.get('input[name="subscriptionAt"]')
        .clear({ force: true })
        .type(inputFormatedDate, { force: true })
      cy.pause()
    })
    cy.get('[data-test="submit"]').click({ force: true })
    cy.get('[data-test="submit"]').should('not.exist')
    cy.contains(subscriptionName).should('exist')
  })

  // TODO: uncomment test
  // Issue here is that the element is not visible in the viewport so shild elemens can't be clicked
  // it('should be able to cancel a future subscription', () => {
  //   cy.get(`[data-test="${subscriptionName}"]`).within(() => {
  //     cy.contains('Pending').should('exist')
  //     cy.get(`[data-test="menu-subscription"]`).click({ force: true })
  //   })
  //   cy.get(`[data-test="terminate-subscription"]`).click({ force: true })
  //   cy.get(`[data-test="warning-confirm"]`).click({ force: true })
  //   cy.contains(subscriptionName).should('not.exist')
  // })
})
