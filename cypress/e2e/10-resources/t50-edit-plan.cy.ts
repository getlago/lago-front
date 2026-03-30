import {
  customerName,
  planWithChargeCodeNew,
  planWithChargesName,
} from '../../support/reusableConstants'

describe('Edit plan', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should be able to close the form without warning dialog when no data has changed', () => {
    cy.visit('/plans')
    cy.get(`[data-test="${planWithChargesName}"] [data-test="open-action-button"]`).click({
      force: true,
    })
    cy.get('[data-test="tab-internal-button-link-update-plan"]').click({ force: true })
    cy.get('input[name="name"]').should('exist')
    cy.get('[data-test="close-create-plan-button"]').click({ force: true })
    cy.get('[data-test="close-create-plan-button"]').should('not.exist')
    cy.url().should('include', '/overview')
  })

  it('should be able to update plan code', () => {
    cy.visit('/plans')
    cy.get(`[data-test="${planWithChargesName}"] [data-test="open-action-button"]`).click({
      force: true,
    })
    cy.get('[data-test="tab-internal-button-link-update-plan"]').click({ force: true })
    cy.get('input[name="name"]').should('not.be.disabled')
    cy.get('input[name="code"]').should('not.be.disabled')

    cy.get('input[name="code"]').clear().type(planWithChargeCodeNew)
    cy.get('[data-test="submit"]', { timeout: 10000 }).should('not.be.disabled')
    cy.get('[data-test="submit"]').click()
    cy.url({ timeout: 10000 }).should('include', '/overview')
  })

  it('should add plan to customer', () => {
    cy.visit('/customers')
    cy.get('[data-test="table-customers-list"] tr').contains(customerName).click()
    cy.get('[data-test="add-subscription"]').click()

    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="planId"]').click()
    cy.get('[data-test^="combobox-item-"]').contains(planWithChargeCodeNew).click()

    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click()

    cy.get('[data-test="entity-section-view-name"]').first().should('have.text', customerName)
  })

  it('should not be able to update locked fields of a used plan', () => {
    cy.visit('/plans')
    cy.get(`[data-test="${planWithChargesName}"] [data-test="open-action-button"]`).click({
      force: true,
    })
    cy.get('[data-test="tab-internal-button-link-update-plan"]').click({ force: true })

    // Name should still be editable
    cy.get('input[name="name"]').should('not.be.disabled')

    // Verify existing charges are displayed
    cy.get('[data-test="usage-charge-selector-0"]').should('exist')

    // Should be able to add a new charge even on a used plan
    cy.get('[data-test="add-usage-charge"]').scrollIntoView()
    cy.get('[data-test="add-usage-charge"]').click()
    cy.get('[data-option-index]', { timeout: 30000 }).should('exist')
    cy.contains('[role="option"]', 'bm count').click({ force: true })
    cy.get('input[name="properties.amount"]').type('3000')
    cy.get('[data-test="usage-charge-drawer-save"]').should('not.be.disabled').click()
    cy.get('[data-test="base-drawer-paper"]', { timeout: 10000 }).should('not.exist')

    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click({ force: true })
    cy.url().should('include', '/overview')
  })
})
