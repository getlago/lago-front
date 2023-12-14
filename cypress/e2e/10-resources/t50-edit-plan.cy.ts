import { customerName, planWithChargesName } from '../../support/reusableConstants'

describe('Edit plan', () => {
  it('should be able to close the form without warning dialog when no data has changed', () => {
    cy.visit('/plans')
    cy.get(`[data-test="${planWithChargesName}-wrapper"]`).within(() => {
      cy.get('[data-test="plan-item-options"]').click({ force: true })
    })
    cy.get('[data-test="tab-internal-button-link-update-plan"]').click({ force: true })
    cy.get('input[name="name"]').should('exist')
    cy.get('[data-test="close-create-plan-button"]').click({ force: true })
    cy.get('[data-test="close-create-plan-button"]').should('not.exist')
    cy.url().should('include', '/overview')
  })

  it('should be able to update all information of unused plan', () => {
    cy.visit('/plans')
    cy.get(`[data-test="${planWithChargesName}-wrapper"]`).within(() => {
      cy.get('[data-test="plan-item-options"]').click({ force: true })
    })
    cy.get('[data-test="tab-internal-button-link-update-plan"]').click({ force: true })
    cy.get('input[name="name"]').should('not.be.disabled')
    cy.get('input[name="code"]').should('not.be.disabled')
    cy.get('textarea[name="description"]', { timeout: 10000 }).should('not.be.disabled')
    cy.get(`[data-test="fixed-fee-section-accordion"]`).within(() => {
      cy.get(`.MuiAccordionSummary-root`).click({ force: true })
    })
    // cy.get('input[name="amountCents"]', { timeout: 10000 }).should('not.be.disabled')
    cy.get('input[name="amountCurrency"]').eq(0).should('not.be.disabled')
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('[data-test="open-charge"]').eq(1).click({ force: true })
    cy.get('input[name="chargeModel"]').should('not.be.disabled')
    cy.get('input[name="properties.amount"]').should('not.be.disabled')
    // TODO: fix, cause with amountInput introduction
    // BE is expecting string where we manage amount as int
    // cy.get('[data-test="submit"]').should('be.disabled')

    cy.get('input[name="code"]').type('new code plan with charge')
    cy.get('[data-test="submit"]').click({ force: true })
  })

  // TODO: uncomment when CI e2e api setup is fixed
  // it('should add plan to customer', () => {
  //   cy.visit('/customers')
  //   cy.get(`[data-test="${customerName}"]`).click({ force: true })
  //   cy.get(`[data-test="add-subscription"]`).click({ force: true })
  //   cy.get('[data-test="submit"]').should('be.disabled')
  //   cy.get('input[name="planId"]').click({ force: true })
  //   cy.get(
  //     '[data-test="combobox-item-a plan with charges - (a_plan_with_chargesnew_code_plan_with_charge)"]'
  //   ).click()
  //   cy.get('[data-test="submit"]').should('not.be.disabled')
  //   cy.get('[data-test="submit"]').click()
  //   cy.contains(customerName).should('exist')
  // })

  // it('should not be able to update all information of unused plan', () => {
  //   cy.visit('/plans')
  //   cy.get(`[data-test="${planWithChargesName}-wrapper"]`).within(() => {
  //     cy.get('[data-test="plan-item-options"]').click({ force: true })
  //   })
  //   cy.get('[data-test="tab-internal-button-link-update-plan"]').click({ force: true })
  //   cy.get('input[name="name"]').should('not.be.disabled')
  //   cy.get('textarea[name="description"]', { timeout: 10000 }).should('not.be.disabled')
  //   cy.get(`[data-test="fixed-fee-section-accordion"]`).within(() => {
  //     cy.get(`.MuiAccordionSummary-root`).click({ force: true })
  //   })

  //   cy.get('input[name="amountCents"]')
  //     .scrollIntoView({
  //       offset: { top: -100, left: 0 },
  //       duration: 0,
  //     })
  //     .should('be.disabled')
  //   cy.get('input[name="amountCurrency"]').should('be.disabled')
  //   cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
  //   cy.get('[data-test="open-charge"]').eq(1).click({ force: true })
  //   cy.get('input[name="chargeModel"]').should('be.disabled')
  //   cy.get('input[name="properties.amount"]').should('not.be.disabled')
  //   cy.get('[data-test="submit"]').should('be.disabled')
  //   cy.get('[data-test="open-charge"]').eq(1).click({ force: true })

  //   cy.get('[data-test="add-metered-charge"]').last().click({ force: true })
  //   cy.get('[data-option-index="1"]').click()
  //   cy.get('[data-test="submit"]').should('be.disabled')
  //   cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
  //   cy.get('input[name="chargeModel"]').last().should('have.value', 'Standard pricing')
  //   cy.get('input[name="properties.amount"]').last().type('3000')
  //   cy.get('[data-test="submit"]').should('not.be.disabled')
  //   cy.get('[data-test="submit"]').click({ force: true })
  // })
})
