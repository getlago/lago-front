import { planWithChargesName, customerName } from '../support/reusableConstants'

describe('Edit plan', () => {
  describe('when no data has changed', () => {
    it('should be able to close the form without warning dialog', () => {
      cy.visit('/plans')
      cy.get(`[data-test="${planWithChargesName}"]`).click()
      cy.get('[data-test="close-create-plan-button"]').click()
      cy.get('[data-test="close-create-plan-button"]').should('not.exist')
      cy.url().should('be.equal', Cypress.config().baseUrl + '/plans')
    })
  })

  it('should be able to update all information of unused plan', () => {
    cy.visit('/plans')
    cy.get(`[data-test="${planWithChargesName}"]`).click()
    cy.get('input[name="name"]').should('not.be.disabled')
    cy.get('input[name="code"]').should('not.be.disabled')
    cy.get('textarea[name="description"]').should('not.be.disabled')
    cy.get('input[name="amountCents"]').should('not.be.disabled')
    cy.get('input[name="amountCurrency"]').eq(0).should('not.be.disabled')
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('[data-test="open-charge"]').first().click()
    cy.get('input[name="chargeModel"]').should('not.be.disabled')
    cy.get('input[name="properties.amount"]').should('not.be.disabled')
    // TODO: fix, cause with amountInput introduction
    // BE is expecting string where we manage amount as int
    // cy.get('[data-test="submit"]').should('be.disabled')

    cy.get('input[name="code"]').type('new code plan with charge')
    cy.get('[data-test="submit"]').click()
  })

  it('should add plan to customer', () => {
    cy.visit('/customers')
    cy.get(`[data-test="${customerName}"]`).click()
    cy.get(`[data-test="add-subscription"]`).click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="planId"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get('[data-test="submit"]').click()
    cy.get('[data-test="submit"]').should('not.exist')
    cy.contains(customerName).should('exist')
  })

  it('should not be able to update all information of unused plan', () => {
    cy.visit('/plans')
    cy.get(`[data-test="${planWithChargesName}"]`).click()
    cy.get('input[name="name"]').should('not.be.disabled')
    cy.get('input[name="code"]').should('be.disabled')
    cy.get('textarea[name="description"]').should('not.be.disabled')
    cy.get('input[name="amountCents"]').should('be.disabled')
    cy.get('input[name="amountCurrency"]').eq(0).should('be.disabled')
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('[data-test="open-charge"]').first().click()
    cy.get('input[name="chargeModel"]').should('be.disabled')
    cy.get('input[name="properties.amount"]').should('be.disabled')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="open-charge"]').first().click()

    cy.get('[data-test="add-metered-charge"]').last().click()
    cy.get('[data-option-index="1"]').click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Standard pricing')
    cy.get('input[name="properties.amount"]').last().type('3000')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click()
  })
})
