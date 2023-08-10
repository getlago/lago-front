const { defineConfig } = require('cypress')

require('dotenv').config({ path: '../.env' })

module.exports = defineConfig({
  projectId: 'u863yi',
  e2e: {
    baseUrl: process.env.CYPRESS_APP_URL,
    specPattern: [
      // Auth
      'auth/signup.cy.ts',
      'auth/login.cy.ts',
      // Resources
      'create-bm.cy.ts',
      'create-plan.cy.ts',
      'create-customer.cy.ts',
      'add-subscription.cy.ts',
      'coupons-create-edit-apply.cy.ts',
      'addon-create-edit.cy.ts',
      // Other
      'invitations.cy.ts',
      'edit-plan.cy.ts',
      '*.ts',
    ],
  },
})
