describe('Log in page test', () => {
  it('should redirect to home page when right credentials', () => {
    cy.visit('login')

    cy.get('input[name="email"]').type('usertest@lago.com')
    cy.get('input[name="password"]').type('P@ssw0rd')
    cy.get('[data-test="submit"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/')
    cy.get('[data-test="error-alert"]').should('not.exist')
  })

  it('should display an error when wrong credentials', () => {
    cy.visit('/login')

    cy.get('input[name="email"]').type('usertest@lago.com')
    cy.get('input[name="password"]').type('IHateLago')
    cy.get('[data-test="submit"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/login')
    cy.get('[data-test="error-alert"]').should('exist')
  })

  it('should display errors if inputs are not filled', () => {
    cy.visit('/login')

    cy.get('[data-test="submit"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/login')
    cy.get('[data-test="text-field-error"]').should('have.length', 2)
  })

  it('should redirect on sign up on link click', () => {
    cy.visit('/login')

    cy.get('[href="/sign-up"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/sign-up')
  })
})
