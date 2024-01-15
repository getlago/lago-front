const { defineConfig } = require('cypress')

require('dotenv').config({ path: '../.env' })

module.exports = defineConfig({
  projectId: 'u863yi',
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: [
      'cypress/e2e/00-auth/t0-signup.cy.ts',
      'cypress/e2e/00-auth/t10-login.cy.ts',
      'cypress/e2e/10-resources/t10-create-taxes.cy.ts',
      'cypress/e2e/10-resources/t20-create-customer.cy.ts',
      'cypress/e2e/10-resources/t30-create-bm.cy.ts',
      'cypress/e2e/10-resources/t40-create-plan.cy.ts',
      'cypress/e2e/10-resources/t50-edit-plan.cy.ts',
      'cypress/e2e/10-resources/t60-coupons-create-edit-apply.cy.ts',
      'cypress/e2e/10-resources/t70-addon-create-edit.cy.ts',
      'cypress/e2e/t10-add-subscription.cy.ts',
      'cypress/e2e/t20-invitations.cy.ts',
      'cypress/e2e/t30-create-one-off-invoice.cy.ts',
    ]
  },
})
