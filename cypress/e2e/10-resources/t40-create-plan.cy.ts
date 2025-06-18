import { planWithChargesName } from '../../support/reusableConstants'

describe('Create plan', () => {
  beforeEach(() => {
    cy.login().visit('/plans')
  })

  it('should be able to access plans', () => {
    cy.get('[data-test="create-plan"]').should('exist')
    cy.get('[data-test="empty-state"]').should('exist')
  })

  it('should be able to create a simple plan', () => {
    const randomId = Math.round(Math.random() * 1000)
    const planName = `plan ${randomId}`
    const planCode = `plan_${randomId}`

    cy.get('[data-test="create-plan"]').click({ force: true })
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')
    cy.get('input[name="name"]').type(planName)
    cy.get('input[name="code"]').should('have.value', planCode)
    cy.get('[data-test="show-description"]').click({ force: true })
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('input[name="amountCents"]').type('30000')
    cy.get('[data-test="submit"]').click({ force: true })
    cy.url().should('include', '/overview')
    cy.contains(planName).should('exist')
  })

  it('should be able to create a plan with all 0 dimension charges and submit', () => {
    cy.get('[data-test="create-plan"]').click({ force: true })
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')
    cy.get('input[name="name"]').type(planWithChargesName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').clear().type(planWithChargesName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="show-description"]').click({ force: true })
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="amountCents"]').type('30000')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('input[name="amountCurrency"]').click({ force: true })
    cy.get('[data-test="USD"]').click({ force: true })

    // Standard
    cy.get('[data-test="add-charge"]').first().click({ force: true })
    cy.get('[data-test="add-metered-charge"]').first().click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Standard pricing')
    cy.get('input[name="properties.amount"]').type('5000')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Graduated
    cy.get('[data-test="add-charge"]').last().click({ force: true })
    cy.get('[data-test="add-metered-charge"]').last().click({ force: true })
    cy.get('[data-option-index="1"]').click({ force: true })
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click({ force: true })
    cy.get('[data-test="graduated"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Graduated pricing')
    cy.get('[data-test="row-2"]').should('not.exist')
    cy.get('[data-test="add-tier"]').click({ force: true })
    cy.get('[data-test="row-2"]').should('exist')
    cy.get('[data-test="cell-amount-0"]').type('1')
    cy.get('[data-test="cell-amount-1"]').type('1')
    cy.get('[data-test="cell-amount-2"]').type('1')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Graduated percentage
    cy.get('[data-test="add-charge"]').last().click({ force: true })
    cy.get('[data-test="add-metered-charge"]').last().click({ force: true })
    cy.get('[data-option-index="1"]').click({ force: true })
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click({ force: true })
    cy.get('[data-test="graduated_percentage"]').click({ force: true })
    cy.get('[data-test="charge-accordion-2"]').within(() => {
      cy.get('input[name="chargeModel"]')
        .last()
        .should('have.value', 'Graduated percentage pricing')
      cy.get('[data-test="add-tier"]').last().click({ force: true })
      cy.get('[data-test="cell-rate-0"]').type('1')
      cy.get('[data-test="cell-rate-1"]').type('1')
      cy.get('[data-test="cell-rate-2"]').type('1')
    })
    cy.get('[data-test="row-2"]').should('have.length', 2)
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Package
    cy.get('[data-test="add-charge"]').last().click({ force: true })
    cy.get('[data-test="add-metered-charge"]').last().click({ force: true })
    cy.get('[data-option-index="1"]').click({ force: true })
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click({ force: true })
    cy.get('[data-test="package"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Package pricing')
    cy.get('input[name="properties.amount"]').last().type('1')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Percentage
    cy.get('[data-test="add-charge"]').last().click({ force: true })
    cy.get('[data-test="add-metered-charge"]').last().click({ force: true })
    cy.get('[data-option-index="1"]').click({ force: true })
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click({ force: true })
    cy.get('[data-test="percentage"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Percentage pricing')
    cy.get('input[name="properties.rate"]').last().type('1')
    cy.get('[data-test="add-fixed-fee"]').click({ force: true })
    cy.get('input[name="properties.fixedAmount"]').should('exist')
    cy.get('[data-test="add-free-units"]').click({ force: true })
    cy.get('[data-test="add-free-units-events"]').click({ force: true })
    cy.get('[data-test="free-unit-per-event"] input').should('exist')
    cy.get('[data-test="add-free-units"]').click({ force: true })
    cy.get('[data-test="add-free-units-total-amount"]').click({ force: true })
    cy.get('[data-test="free-unit-per-total-aggregation"] input').should('exist')

    // Min max
    cy.get('[data-test="add-min-max-drowdown-cta"]').click({ force: true })
    cy.get('[data-test="add-min-cta"]').click({ force: true })
    cy.get('[data-test="per-transaction-min-amount"]').should('exist')
    cy.get('[data-test="add-min-max-drowdown-cta"]').click({ force: true })
    cy.get('[data-test="add-max-cta"]').click({ force: true })
    cy.get('[data-test="per-transaction-max-amount"]').should('exist')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    // Volume
    cy.get('[data-test="add-charge"]').last().click({ force: true })
    cy.get('[data-test="add-recurring-charge"]').last().click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').last().click({ force: true })
    cy.get('[data-test="volume"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Volume pricing')
    cy.get('[data-test="add-tier"]').last().click({ force: true })
    cy.get('[data-test="cell-amount-0"]').last().type('1')
    cy.get('[data-test="cell-amount-1"]').last().type('1')
    cy.get('[data-test="cell-amount-2"]').last().type('1')
    cy.get('[data-test="submit"]').should('not.be.disabled')

    cy.get('[data-test="submit"]').click({ force: true })
    cy.url().should('include', '/overview')
    cy.contains(planWithChargesName).should('exist')
  })

  describe('anti-regression', () => {
    // https://github.com/getlago/lago-front/pull/792
    it('should be able to edit percentage charge without data loss', () => {
      const randomId = Math.round(Math.random() * 1000)
      const planName = `plan ${randomId}`
      const planCode = `plan_${randomId}`

      // Default plan data
      cy.get('[data-test="create-plan"]').click({ force: true })
      cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')
      cy.get('input[name="name"]').type(planName)
      cy.get('input[name="code"]').should('have.value', planCode)
      cy.get('[data-test="show-description"]').click({ force: true })
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('input[name="amountCents"]').type('30000')

      // Config charge
      cy.get('[data-test="add-charge"]').last().click({ force: true })
      cy.get('[data-test="add-metered-charge"]').last().click({ force: true })
      cy.get('[data-option-index="1"]').click({ force: true })
      cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
      cy.get('input[name="chargeModel"]').last().click({ force: true })
      cy.get('[data-test="percentage"]').click({ force: true })
      cy.get('input[name="chargeModel"]').last().should('have.value', 'Percentage pricing')
      cy.get('input[name="properties.rate"]').last().type('1')
      cy.get('[data-test="add-fixed-fee"]').click({ force: true })
      cy.get('input[name="properties.fixedAmount"]').last().type('1')
      cy.get('[data-test="add-free-units"]').click({ force: true })
      cy.get('[data-test="add-free-units-events"]').click({ force: true })
      cy.get('[data-test="free-unit-per-event"] input').last().type('1')
      cy.get('[data-test="add-free-units"]').click({ force: true })
      cy.get('[data-test="add-free-units-total-amount"]').click({ force: true })
      cy.get('[data-test="free-unit-per-total-aggregation"] input').last().type('1')

      // Test regression scenario
      cy.get('[data-test="remove-fixed-fee"]').click({ force: true })
      cy.get('[data-test="remove-free-units-per-event"]').click({ force: true })
      cy.get('[data-test="remove-free-unit-per-total-aggregation"]').click({ force: true })
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('input[name="properties.rate"]').should('have.value', '1')

      cy.get('[data-test="submit"]').click({ force: true })
      cy.url().should('include', '/overview')
      cy.contains(planName).should('exist')
    })
  })
})
