/// <reference types="cypress" />

declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    /**
     * Login user
     * @example
     * cy.login('usertest@lago.com', 'P@ssw0rd')
     */
    login(email?: string, password?: string): Chainable<unknown>

    /**
     * Logout current user
     * @example
     * cy.logout()
     */
    logout(): Chainable<unknown>

    /**
     * Signup user
     * @example
     * cy.signup({ organizationName: 'Lago', email: 'user@lago.com', password: 'P@ssw0rd' })
     */
    signup({
      organizationName,
      email,
      password,
    }: {
      organizationName: string
      email: string
      password: string
    }): Chainable<unknown>
  }

  interface Cypress {
    mocha: any // for Cypress.mocha
  }
}
