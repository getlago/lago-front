// describe('Invitations', () => {
//   const inviteEmail = `test-invite-${Math.round(Math.random() * 10000)}@gmail.com`

//   // it('should be able to create an invitation', () => {
//   //   cy.visit('/settings/members')
//   //   cy.get(`[role="dialog"]`).should('not.exist')
//   //   cy.get(`[data-test="create-invite-button"]`).click()
//   //   cy.get(`[role="dialog"]`).should('exist')
//   //   cy.get('[data-test="submit-invite-button"]').should('be.disabled')
//   //   cy.get('input[name="email"]').type(inviteEmail)
//   //   cy.get('[data-test="submit-invite-button"]').click()
//   //   cy.get('[data-test="copy-invite-link-button"]').click()
//   //   cy.get(`[role="dialog"]`).should('not.exist')
//   // })

//   it('should be able to accept the invitation', () => {
//     cy.visit('/settings/members')
//     cy.get(`[data-test="copy-invite-link"]`).first().click()

//     cy.window().then((win) =>
//       new Cypress.Promise((resolve, reject) =>
//         win.navigator.clipboard.readText().then(resolve).catch(reject)
//       ).then((text) => {
//         console.log(text)
//       })
//     )
//   })
// })
