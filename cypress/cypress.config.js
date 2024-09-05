const { defineConfig } = require('cypress')

require('dotenv').config({ path: '../.env' })

module.exports = defineConfig({
  projectId: 'u863yi',
  e2e: {
    baseUrl: process.env.CYPRESS_APP_URL,
    experimentalRunAllSpecs: true,
  },
})
