import { planWithChargesName } from '../support/reusableConstants'

describe('Create plan', () => {
  beforeEach(() => {
    cy.login('usertest@lago.com', 'P@ssw0rd')
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
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('input[name="amountCents"]').type('30000')
    cy.get('[data-test="submit"]').click()
    cy.get('[data-test="go-back"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/plans')
    cy.contains(planName).should('exist')
  })

  it('should be able to create a plan with charges', () => {
    cy.get('[data-test="create-plan"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/plans')
    cy.get('input[name="name"]').type(planWithChargesName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').type(planWithChargesName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="amountCents"]').type('30000')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('input[name="amountCurrency"]').click()
    cy.get('[data-test="UAH"]').click()

    cy.get('[data-test="add-charge"]').click()
    cy.get('[data-test="submit-add-charge"]').should('be.disabled')
    cy.get('input[name="billableMetricId"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get('[data-test="submit-add-charge"]').click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="remove-charge"]').should('exist').and('not.be.disabled')
    cy.get('input[name="chargeModel"]').should('have.value', 'Standard pricing')
    cy.get('input[name="amount"]').type('5000')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('input[name="amountCurrency"]').eq(1).should('be.disabled')
    cy.get('input[name="amountCurrency"]').eq(1).should('have.value', 'UAH')

    cy.get('[data-test="submit"]').click()
    cy.get('[data-test="go-back"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/plans')
    cy.contains(planWithChargesName).should('exist')
  })
})
