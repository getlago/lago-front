import { defineConfig } from 'cypress'
import dotenv from 'dotenv'
import fs from 'node:fs'

dotenv.config({ path: '../.env' })

export default defineConfig({
  projectId: 'u863yi',
  retries: 3,
  e2e: {
    baseUrl: process.env.CYPRESS_APP_URL,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on) {
      on('after:spec', (_spec, results) => {
        if (results && results.video) {
          // Do we have failures for any retry attempts?
          const failures = results.tests.some((test) =>
            test.attempts.some((attempt) => attempt.state === 'failed'),
          )
          if (!failures) {
            // delete the video if the spec passed and no tests retried
            fs.unlinkSync(results.video)
          }
        }
      })
    },
  },
})
