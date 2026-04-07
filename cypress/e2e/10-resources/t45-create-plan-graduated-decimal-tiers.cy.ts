import { DESKTOP_ACTIONS_BLOCK_TEST_ID } from '~/components/MainHeader/mainHeaderTestIds'

describe('Create plan with graduated decimal tiers', () => {
  beforeEach(() => {
    cy.login().visit('/plans')
  })

  it('should create a plan with decimal graduated tiers', () => {
    const randomId = Math.round(Math.random() * 10000)
    const planName = `decimal graduated plan ${randomId}`

    // Navigate to create plan
    cy.get(`[data-test="${DESKTOP_ACTIONS_BLOCK_TEST_ID}"] [data-test="create-plan"]`).click({
      force: true,
    })
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')

    // Fill plan basics
    cy.get('input[name="name"]').type(planName)
    cy.get('input[name="amountCents"]').type('1000')

    // Add a graduated charge
    cy.get('[data-test="add-charge"]').first().click({ force: true })
    cy.get('[data-test="add-metered-charge"]').first().click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().click({ force: true })
    cy.get('[data-test="graduated"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Graduated pricing')

    // Add a tier so we have 3 rows (tier 1, tier 2, and final ∞ row)
    cy.get('[data-test="add-tier"]').click({ force: true })
    cy.get('[data-test="row-2"]').should('exist')

    // Set tier 1 toValue to 0.1 (decimal)
    cy.get('[data-test="cell-to-value-0"]').find('input').clear().type('0.1')

    // Verify tier 2 fromValue auto-updates to 0.2 (next decimal point in line)
    cy.get('[data-test="cell-from-value-1"]').should('contain.text', '0.2')

    // Set tier 2 toValue to 1
    cy.get('[data-test="cell-to-value-1"]').find('input').clear().type('1')

    // Verify tier 3 (last row) fromValue auto-updates to 1.1 (next decimal point in line)
    cy.get('[data-test="cell-from-value-2"]').should('contain.text', '1.1')

    // Fill per-unit amounts
    cy.get('[data-test="cell-amount-0"]').type('5')
    cy.get('[data-test="cell-amount-1"]').type('3')
    cy.get('[data-test="cell-amount-2"]').type('1')

    // Submit and verify
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click({ force: true })
    cy.url().should('include', '/overview')
    cy.contains(planName).should('exist')
  })

  it('should create a plan with integer graduated tiers (regression)', () => {
    const randomId = Math.round(Math.random() * 10000)
    const planName = `integer graduated plan ${randomId}`

    // Navigate to create plan
    cy.get(`[data-test="${DESKTOP_ACTIONS_BLOCK_TEST_ID}"] [data-test="create-plan"]`).click({
      force: true,
    })
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')

    // Fill plan basics
    cy.get('input[name="name"]').type(planName)
    cy.get('input[name="amountCents"]').type('1000')

    // Add a graduated charge
    cy.get('[data-test="add-charge"]').first().click({ force: true })
    cy.get('[data-test="add-metered-charge"]').first().click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().click({ force: true })
    cy.get('[data-test="graduated"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Graduated pricing')

    // Add a tier so we have 3 rows
    cy.get('[data-test="add-tier"]').click({ force: true })
    cy.get('[data-test="row-2"]').should('exist')

    // Set tier 1 toValue to 10 (integer)
    cy.get('[data-test="cell-to-value-0"]').find('input').clear().type('10')

    // Verify tier 2 fromValue is 11 (integer-step model: previous toValue + 1)
    cy.get('[data-test="cell-from-value-1"]').should('contain.text', '11')

    // Set tier 2 toValue to 20
    cy.get('[data-test="cell-to-value-1"]').find('input').clear().type('20')

    // Verify tier 3 fromValue is 21
    cy.get('[data-test="cell-from-value-2"]').should('contain.text', '21')

    // Fill per-unit amounts
    cy.get('[data-test="cell-amount-0"]').type('5')
    cy.get('[data-test="cell-amount-1"]').type('3')
    cy.get('[data-test="cell-amount-2"]').type('1')

    // Submit and verify
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click({ force: true })
    cy.url().should('include', '/overview')
    cy.contains(planName).should('exist')
  })

  it('should create a plan with decimal graduated percentage tiers', () => {
    const randomId = Math.round(Math.random() * 10000)
    const planName = `decimal graduated pct plan ${randomId}`

    // Navigate to create plan
    cy.get(`[data-test="${DESKTOP_ACTIONS_BLOCK_TEST_ID}"] [data-test="create-plan"]`).click({
      force: true,
    })
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')

    // Fill plan basics
    cy.get('input[name="name"]').type(planName)
    cy.get('input[name="amountCents"]').type('1000')

    // Add a graduated percentage charge
    cy.get('[data-test="add-charge"]').first().click({ force: true })
    cy.get('[data-test="add-metered-charge"]').first().click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().click({ force: true })
    cy.get('[data-test="graduated_percentage"]').click({ force: true })
    cy.get('input[name="chargeModel"]').last().should('have.value', 'Graduated percentage pricing')

    // Add a tier so we have 3 rows
    cy.get('[data-test="add-tier"]').click({ force: true })
    cy.get('[data-test="row-2"]').should('exist')

    // Set tier 1 toValue to 0.1 (decimal)
    cy.get('[data-test="cell-to-value-0"]').find('input').clear().type('0.1')

    // Verify tier 2 fromValue auto-updates to 0.2 (next decimal point in line)
    cy.get('[data-test="cell-from-value-1"]').should('contain.text', '0.2')

    // Set tier 2 toValue to 1
    cy.get('[data-test="cell-to-value-1"]').find('input').clear().type('1')

    // Verify tier 3 fromValue auto-updates to 1.1 (next decimal point in line)
    cy.get('[data-test="cell-from-value-2"]').should('contain.text', '1.1')

    // Fill percentage rates
    cy.get('[data-test="cell-rate-0"]').type('10')
    cy.get('[data-test="cell-rate-1"]').type('5')
    cy.get('[data-test="cell-rate-2"]').type('2')

    // Submit and verify
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click({ force: true })
    cy.url().should('include', '/overview')
    cy.contains(planName).should('exist')
  })
})
