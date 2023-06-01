import { planWithChargesName } from '../support/reusableConstants'

describe('Create plan', () => {
  beforeEach(() => {
    cy.visit('/plans')
  })

  it('should be able to access plans', () => {
    cy.get('[data-test="create-plan"]').should('exist')
    cy.get('[data-test="empty"]').should('exist')
  })

  it('should be able to create a simple plan', () => {
    const randomId = Math.round(Math.random() * 1000)
    const planName = `plan ${randomId}`

    cy.get('[data-test="create-plan"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')
    cy.get('input[name="name"]').type(planName)
    cy.get('input[name="code"]').type(planName)
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('input[name="amountCents"]').type('30000')
    cy.get('[data-test="submit"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/plans')
    cy.contains(planName).should('exist')
  })

  it('should be able to create a plan with all 0 dimension charges and submit', () => {
    cy.get('[data-test="create-plan"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')
    cy.get('input[name="name"]').type(planWithChargesName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').type(planWithChargesName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="amountCents"]').type('30000')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('input[name="amountCurrency"]').click()
    cy.get('[data-test="USD"]').click()

    // Standard
    cy.get('[data-test="add-charge"]').first().click()
    cy.get('input[name="searchChargeInput"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Standard pricing')
    cy.get('input[name="properties.amount"]').type('5000')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Graduated
    cy.get('[data-test="add-charge"]').last().click()
    cy.get('input[name="searchChargeInput"]').click()
    cy.get('[data-option-index="1"]').click()
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click()
    cy.get('[data-test="graduated"]').click()
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Graduated pricing')
    cy.get('[data-test="row-2"]').should('not.exist')
    cy.get('[data-test="add-tier"]').click()
    cy.get('[data-test="row-2"]').should('exist')
    cy.get('[data-test="cell-amount-0"]').type('1')
    cy.get('[data-test="cell-amount-1"]').type('1')
    cy.get('[data-test="cell-amount-2"]').type('1')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Package
    cy.get('[data-test="add-charge"]').last().click()
    cy.get('input[name="searchChargeInput"]').click()
    cy.get('[data-option-index="1"]').click()
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click()
    cy.get('[data-test="package"]').click()
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Package pricing')
    cy.get('input[name="properties.amount"]').last().type('1')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Percentage
    cy.get('[data-test="add-charge"]').last().click()
    cy.get('input[name="searchChargeInput"]').click()
    cy.get('[data-option-index="1"]').click()
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click()
    cy.get('[data-test="percentage"]').click()
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Percentage pricing')
    cy.get('input[name="properties.rate"]').last().type('1')
    cy.get('[data-test="add-fixed-fee"]').click()
    cy.get('input[name="properties.fixedAmount"]').should('exist')
    cy.get('[data-test="add-free-units"]').click()
    cy.get('[data-test="add-free-units-events"]').click()
    cy.get('[data-test="free-unit-per-event"] input').should('exist')
    cy.get('[data-test="add-free-units"]').click()
    cy.get('[data-test="add-free-units-total-amount"]').click()
    cy.get('[data-test="free-unit-per-total-aggregation"] input').should('exist')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Volume
    cy.get('[data-test="add-charge"]').last().click()
    cy.get('input[name="searchChargeInput"]').click()
    cy.get('[data-option-index="1"]').click()
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click()
    cy.get('[data-test="volume"]').click()
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Volume pricing')
    cy.get('[data-test="add-tier"]').last().click()
    cy.get('[data-test="cell-amount-0"]').last().type('1')
    cy.get('[data-test="cell-amount-1"]').last().type('1')
    cy.get('[data-test="cell-amount-2"]').last().type('1')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    cy.get('[data-test="submit"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/plans')
    cy.contains(planWithChargesName).should('exist')
  })

  describe('anti-regression', () => {
    // https://github.com/getlago/lago-front/pull/792
    it('should be able to edit percentage charge without data loss', () => {
      const randomId = Math.round(Math.random() * 1000)
      const planName = `plan ${randomId}`

      // Default plan data
      cy.get('[data-test="create-plan"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')
      cy.get('input[name="name"]').type(planName)
      cy.get('input[name="code"]').type(planName)
      cy.get('[data-test="show-description"]').click()
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('input[name="amountCents"]').type('30000')

      // Config charge
      cy.get('[data-test="add-charge"]').last().click()
      cy.get('input[name="searchChargeInput"]').click()
      cy.get('[data-option-index="1"]').click()
      cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
      cy.get('input[name="chargeModel"]').last().click()
      cy.get('[data-test="percentage"]').click()
      cy.get('input[name="chargeModel"]').last().should('have.value', 'Percentage pricing')
      cy.get('input[name="properties.rate"]').last().type('1')
      cy.get('[data-test="add-fixed-fee"]').click()
      cy.get('input[name="properties.fixedAmount"]').last().type('1')
      cy.get('[data-test="add-free-units"]').click()
      cy.get('[data-test="add-free-units-events"]').click()
      cy.get('[data-test="free-unit-per-event"] input').last().type('1')
      cy.get('[data-test="add-free-units"]').click()
      cy.get('[data-test="add-free-units-total-amount"]').click()
      cy.get('[data-test="free-unit-per-total-aggregation"] input').last().type('1')

      // Test regression scenario
      cy.get('[data-test="remove-fixed-fee"]').click()
      cy.get('[data-test="remove-free-units-per-event"]').click()
      cy.get('[data-test="remove-free-unit-per-total-aggregation"]').click()
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('input[name="properties.rate"]').should('have.value', '1')

      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/plans')
      cy.contains(planName).should('exist')
    })
  })
})
