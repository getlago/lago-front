describe('Invitations', () => {
  beforeEach(() => {
    cy.login()
  })

  const inviteEmail = `test-invite-${Math.round(Math.random() * 10000)}@gmail.com`

  it('should be able to create an invitation', () => {
    cy.visit('/settings/members')
    cy.get(`[role="dialog"]`).should('not.exist')
    cy.get(`[data-test="create-invite-button"]`).click()
    cy.get(`[role="dialog"]`).should('exist')
    cy.get('[data-test="submit-invite-button"]').should('be.disabled')
    cy.get('input[name="email"]').type(inviteEmail)
    cy.get('[data-test="submit-invite-button"]').click()
    cy.get('[data-test="copy-invite-link-button"]').click()
    cy.get(`[role="dialog"]`).should('not.exist')
  })

  it('invite link should have correct format', () => {
    cy.visit('/settings/members')

    cy.get('#table-members-setting-invivations-list-row-0')
      .first()
      .within(() => {
        cy.get(`button`).click()
      })

    cy.get('[data-test="copy-invite-link"]').click()

    cy.url().should('be.equal', Cypress.config().baseUrl + '/settings/members')
    cy.window().then((win) => {
      new Cypress.Promise((resolve, reject) =>
        win.navigator.clipboard.readText().then(resolve).catch(reject),
      ).then((text) => {
        expect(text).to.contain('/invitation/')
      })
    })
  })
})
