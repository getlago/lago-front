// TODO: uncomment, flaky test
// import { DateTime } from 'luxon'

// import { customerName, userEmail, userPassword } from '../support/reusableConstants'

// describe('Add and edit subscription', () => {
//   const subscriptionName = `Subscription-${Math.round(Math.random() * 10000)}`
//   const subscriptionAt = DateTime.now().plus({ days: 2 }).toISO()
//   const inputFormatedDate = DateTime.fromISO(subscriptionAt).toFormat('LL/dd/yyyy')
//   const formatedDate = DateTime.fromISO(subscriptionAt).toFormat('LLL. dd, yyyy')
//   const newSubscriptionName = `updated-${subscriptionName}`
//   const newsubscriptionAt = DateTime.now().minus({ days: 10 }).toISO()
//   const newInputFormatedDate = DateTime.fromISO(newsubscriptionAt).toFormat('LL/dd/yyyy')
//   const newFormatedDate = DateTime.fromISO(newsubscriptionAt).toFormat('LLL. dd, yyyy')

//   beforeEach(() => {
//     cy.login(userEmail, userPassword)
//     cy.visit('/customers')
//     cy.get(`[data-test="${customerName}"]`).click()
//   })

//   it('should be able to add a subscription to customer', () => {
//     cy.get(`[data-test="add-subscription"]`).click()
//     cy.get('[data-test="submit"]').should('be.disabled')
//     cy.get('input[name="planId"]').click()
//     cy.get('[data-option-index="0"]').click()
//     cy.get('input[name="name"]').type(subscriptionName)
//     cy.get('input[name="subscriptionAt"]').clear().type(inputFormatedDate)
//     cy.get('[data-test="submit"]').click()
//     cy.get('[data-test="submit"]').should('not.exist')
//     cy.contains(subscriptionName).should('exist')
//     cy.contains(formatedDate).should('exist')
//   })

//   it('should be able to edit subscription', () => {
//     cy.get(`[data-test="${subscriptionName}"]`).within(() => {
//       cy.contains('Pending').should('exist')
//       cy.get(`[data-test="menu-subscription"]`).click()
//     })
//     cy.get(`[data-test="edit-subscription"]`).click()
//     cy.get('input[name="name"]').should('have.value', subscriptionName)
//     cy.get('input[name="subscriptionAt"]').should('have.value', inputFormatedDate)
//     cy.get('[data-test="submit-edit-subscription"]').should('be.disabled')
//     cy.get('input[name="name"]').clear().type(newSubscriptionName)
//     cy.get('input[name="subscriptionAt"]').clear().type(newInputFormatedDate)
//     cy.get('[data-test="submit-edit-subscription"]').click()
//     cy.contains(subscriptionName).should('exist')
//     cy.contains(newFormatedDate).should('exist')
//   })

//   it('should not be able to edit subscription date on active subscription', () => {
//     cy.get(`[data-test="${subscriptionName}"]`).within(() => {
//       cy.contains('Pending').should('exist')
//       cy.contains('Active').should('not.exist')
//       cy.get(`[data-test="menu-subscription"]`).click()
//     })
//     cy.get(`[data-test="edit-subscription"]`).click()
//     cy.get('input[name="name"]').should('have.value', newSubscriptionName)
//     cy.get('input[name="subscriptionAt"]').should('be.disabled')
//   })

//   it('should be able to terminate the subscription', () => {
//     cy.get(`[data-test="${newSubscriptionName}"]`).within(() => {
//       cy.get(`[data-test="menu-subscription"]`).click()
//     })
//     cy.get(`[data-test="terminate-subscription"]`).click()
//     cy.get(`[data-test="warning-confirm"]`).click()
//     cy.contains(newSubscriptionName).should('not.exist')
//   })
// })
