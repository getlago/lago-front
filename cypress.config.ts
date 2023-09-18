import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    viewportWidth: 1280, // For it to not be mobile
    viewportHeight: 99999, // Set it very high to prevent out-of-viewport elements
    setupNodeEvents() {
      // implement node event listeners here
    },
  },
})
