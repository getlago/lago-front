import { TAX_TEN_CODE, TAX_TWENTY_CODE } from '../../support/reusableConstants'

describe('Create taxes', () => {
  it('should create taxes', () => {
    cy.visit('/settings/taxes')
    cy.url().should('include', '/settings/taxes')

    // Make sure no tax exists
    cy.get('[data-test="empty-title"]').should('exist')

    // Create tax 10%
    cy.get('[data-test="create-tax-button"]').click()
    cy.url().should('include', '/create/tax')
    cy.get('input[name="name"]').type(TAX_TEN_CODE)
    cy.get('input[name="code"]').type(TAX_TEN_CODE)
    cy.get('input[name="rate"]').type('10')
    cy.get('[data-test="submit"]').click()

    // Create tax 20%
    cy.get('[data-test="create-tax-button"]').click()
    cy.url().should('include', '/create/tax')
    cy.get('input[name="name"]').type(TAX_TWENTY_CODE)
    cy.get('input[name="code"]').type(TAX_TWENTY_CODE)
    cy.get('input[name="rate"]').type('20')
    cy.get('[data-test="submit"]').click()

    cy.get(`[data-test="${TAX_TEN_CODE}"]`).should('exist')
    cy.get(`[data-test="${TAX_TWENTY_CODE}"]`).should('exist')
  })

  it('should assign tax to organization', () => {
    cy.visit('/settings/invoice')
    cy.url().should('include', '/settings/invoice')

    // Make sure no tax are already assigned
    cy.get('[data-test="empty-taxes"]')
      .scrollIntoView({
        offset: { top: -100, left: 0 },
        duration: 0,
      })
      .should('exist')

    // Assign tax 20%
    cy.get('[data-test="add-tax-button"]').click()
    cy.get('[data-test="add-organization-tax-dialog"]').should('exist')
    cy.get('input[name="selectTax"]').click()
    cy.get('[data-option-index="1"]').click()
    cy.get('[data-test="submit-add-organization-tax-dialog-assign-button"]').click()
    cy.get(`[data-test="applied-tax-${TAX_TWENTY_CODE}"]`).should('exist')
  })
})
