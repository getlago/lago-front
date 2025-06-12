// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
// Import commands.js using ES2015 syntax:
import { userEmail, userPassword } from './reusableConstants'

Cypress.Commands.add('login', (email = userEmail, password = userPassword) => {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('[data-test="submit"]').click()
  cy.url().should('be.equal', Cypress.config().baseUrl + '/')
})

// https://docs.cypress.io/api/cypress-api/custom-commands#Overwrite-type-command
// @ts-expect-error custom command
Cypress.Commands.overwrite('type', (originalFn, element, text, options) => {
  // @ts-expect-error custom options
  return originalFn(element, text, { ...options, delay: 0 })
})

beforeEach(() => {
  // Allow access to broswer's clipboard api
  Cypress.automation('remote:debugger:protocol', {
    command: 'Browser.grantPermissions',
    params: {
      permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
      origin: window.location.origin,
    },
  })
})

// Alternatively you can use CommonJS syntax:
// require('./commands')
