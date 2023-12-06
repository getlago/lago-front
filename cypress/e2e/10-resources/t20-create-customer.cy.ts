import { customerName } from '../../support/reusableConstants'

describe('Create customer', () => {
  beforeEach(() => {
    cy.visit('/customers')
  })

  it('should create customer', () => {
    cy.get('[data-test="create-customer"]').click()
    cy.get('input[name="name"]').type(customerName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="externalId"]').type('id-george-de-la-jungle')
    cy.get('[data-test="submit"]').click()
    cy.url().should('include', '/customer/')
    cy.contains(customerName).should('exist')
  })

  describe('anti-regression', () => {
    // https://github.com/getlago/lago-front/pull/892
    it('should be able to edit VAT right after creating a customer', () => {
      const randomNumber = Math.round(Math.random() * 1000)
      const randomId = `Customer ${randomNumber}`

      cy.get('[data-test="create-customer"]').click()
      cy.get('input[name="name"]').type(randomId)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="externalId"]').type(randomId)
      cy.get('[data-test="submit"]').click()
      cy.url().should('include', '/customer/')
      cy.contains(randomId).should('exist')

      cy.get('[data-test="tab-internal-button-link-settings"]').last().click()
      cy.get('[data-test="add-vat-rate-button"]').last().click()
      cy.get('[data-test="edit-customer-vat-rate-dialog"]').should('exist')
    })
  })
})
