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
import './commands'
import { userEmail, userPassword } from './reusableConstants'

beforeEach(() => {
  if (
    // @ts-ignore - prevent to log for all "auth" test suite
    !Cypress.mocha.getRunner().suite.ctx.test.file.includes('auth') &&
    // @ts-ignore - In case we ever need to skip login before one test, add '::preventLogin' in the test name
    !Cypress.mocha.getRunner().suite.ctx.currentTest.title.includes('::preventLogin')
  ) {
    cy.session(
      'LoginTestUser',
      () => {
        cy.login(userEmail, userPassword)
      },
      {
        cacheAcrossSpecs: true,
      }
    )
  }

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
