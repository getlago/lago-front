import { userEmail, userPassword } from '../../support/reusableConstants'

describe('Log in page test', () => {
  it('should redirect to home page when right credentials ::preventLogin', () => {
    cy.visit('login')
    cy.get('input[name="email"]').type(userEmail)
    cy.get('input[name="password"]').type(userPassword)
    cy.get('[data-test="submit"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/')
    cy.get('[data-test="error-alert"]').should('not.exist')
  })

  it('should display an error when wrong credentials ::preventLogin', () => {
    cy.visit('/login')

    cy.get('input[name="email"]').type(userEmail)
    cy.get('input[name="password"]').type('IHateLago')
    cy.get('[data-test="submit"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/login')
    cy.get('[data-test="error-alert"]').should('exist')
  })

  it('should display errors if inputs are not filled ::preventLogin', () => {
    cy.visit('/login')

    cy.get('[data-test="submit"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/login')
    cy.get('[data-test="text-field-error"]').should('have.length', 2)
  })

  it('should redirect on sign up on link click ::preventLogin', () => {
    cy.visit('/login')

    cy.get('[href="/sign-up"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/sign-up')
  })
})
