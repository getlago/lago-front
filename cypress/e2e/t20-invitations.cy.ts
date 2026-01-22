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
    cy.get('input[name="email"]').type(inviteEmail)
    // Select Admin role from the role picker combobox
    cy.get('input[name="role"]').click()
    cy.get('[data-option-index="0"]').click() // Select Admin (first option)
    cy.get('[data-test="submit-invite-button"]').click()
    cy.get('[data-test="copy-invite-link-button"]').click()
    cy.get(`[role="dialog"]`).should('not.exist')
  })

  it('invite link should have correct format', () => {
    cy.visit('/settings/members/invitations')

    cy.get('#table-members-setting-invitations-list-row-0')
      .first()
      .within(() => {
        cy.get(`button`).click()
      })

    cy.get('[data-test="copy-invite-link"]').click()

    cy.url().should('be.equal', Cypress.config().baseUrl + '/settings/members/invitations')
    cy.window().then((win) => {
      new Cypress.Promise((resolve, reject) =>
        win.navigator.clipboard.readText().then(resolve).catch(reject),
      ).then((text) => {
        expect(text).to.contain('/invitation/')
      })
    })
  })
})
