import { customerName } from '../support/reusableConstants'

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
})
