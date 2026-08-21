import { captureMessage } from '@sentry/react'

import { AppEnvEnum } from '~/core/constants/globalTypes'
import { isDevOrQaAppEnv, isProductionAppEnv, reportMissingAppEnv } from '~/core/utils/appEnv'

jest.mock('@sentry/react', () => ({
  captureMessage: jest.fn(),
}))

// Single source of truth for what each environment is allowed to do. The `Record` makes a new
// `AppEnvEnum` member a compile error here, and the membership test below catches a removed one,
// so neither helper can silently keep classifying an environment it no longer knows about.
const CLASSIFIED: Record<AppEnvEnum, { production: boolean; devTools: boolean }> = {
  [AppEnvEnum.production]: { production: true, devTools: false },
  [AppEnvEnum.staging]: { production: false, devTools: false },
  [AppEnvEnum.development]: { production: false, devTools: true },
  [AppEnvEnum.qa]: { production: false, devTools: true },
}

describe('appEnv', () => {
  describe('CLASSIFIED', () => {
    describe('GIVEN the AppEnvEnum members', () => {
      describe('WHEN a member is added to or removed from the enum', () => {
        it('THEN should classify exactly the declared members', () => {
          expect(Object.keys(CLASSIFIED).sort()).toEqual(Object.values(AppEnvEnum).sort())
        })
      })
    })

    describe('GIVEN the classification table', () => {
      describe('WHEN each declared environment is checked', () => {
        it.each(Object.entries(CLASSIFIED))(
          'THEN should report %s as classified',
          (appEnv, { production, devTools }) => {
            expect(isProductionAppEnv(appEnv as AppEnvEnum)).toBe(production)
            expect(isDevOrQaAppEnv(appEnv as AppEnvEnum)).toBe(devTools)
          },
        )
      })
    })
  })

  describe('isProductionAppEnv', () => {
    describe('GIVEN a known non-production environment', () => {
      describe('WHEN the value is staging, development or qa', () => {
        it.each([
          ['staging', AppEnvEnum.staging],
          ['development', AppEnvEnum.development],
          ['qa', AppEnvEnum.qa],
        ])('THEN should return false for %s', (_, appEnv) => {
          expect(isProductionAppEnv(appEnv)).toBe(false)
        })
      })
    })

    describe('GIVEN the production environment', () => {
      describe('WHEN the value is production', () => {
        it('THEN should return true', () => {
          expect(isProductionAppEnv(AppEnvEnum.production)).toBe(true)
        })
      })
    })

    describe('GIVEN no environment at all', () => {
      describe('WHEN APP_ENV was never set on the deployment', () => {
        it('THEN should fail closed and return true for undefined', () => {
          expect(isProductionAppEnv(undefined)).toBe(true)
        })
      })
    })
  })

  describe('isDevOrQaAppEnv', () => {
    describe('GIVEN a developer environment', () => {
      describe('WHEN the value is development or qa', () => {
        it.each([
          ['development', AppEnvEnum.development],
          ['qa', AppEnvEnum.qa],
        ])('THEN should return true for %s', (_, appEnv) => {
          expect(isDevOrQaAppEnv(appEnv)).toBe(true)
        })
      })
    })

    describe('GIVEN a deployed environment', () => {
      describe('WHEN the value is production or staging', () => {
        it.each([
          ['production', AppEnvEnum.production],
          ['staging', AppEnvEnum.staging],
        ])('THEN should return false for %s', (_, appEnv) => {
          expect(isDevOrQaAppEnv(appEnv)).toBe(false)
        })
      })
    })

    describe('GIVEN no environment at all', () => {
      describe('WHEN APP_ENV was never set on the deployment', () => {
        it('THEN should fail closed and return false for undefined', () => {
          expect(isDevOrQaAppEnv(undefined)).toBe(false)
        })
      })
    })
  })

  describe('reportMissingAppEnv', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('GIVEN a deployment that never set APP_ENV', () => {
      describe('WHEN the app boots', () => {
        it('THEN should report the misconfiguration to Sentry as a warning', () => {
          reportMissingAppEnv(undefined)

          expect(captureMessage).toHaveBeenCalledTimes(1)
          expect(captureMessage).toHaveBeenCalledWith(expect.any(String), { level: 'warning' })
        })

        it('THEN should warn in the console for deployments without a Sentry DSN', () => {
          const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

          reportMissingAppEnv(undefined)

          expect(warnSpy).toHaveBeenCalledTimes(1)

          warnSpy.mockRestore()
        })
      })
    })

    describe('GIVEN a deployment with APP_ENV set', () => {
      describe('WHEN the app boots', () => {
        it.each(Object.keys(CLASSIFIED))('THEN should stay silent on %s', (appEnv) => {
          const warnSpy = jest.spyOn(console, 'warn').mockImplementation()

          reportMissingAppEnv(appEnv as AppEnvEnum)

          expect(captureMessage).not.toHaveBeenCalled()
          expect(warnSpy).not.toHaveBeenCalled()

          warnSpy.mockRestore()
        })
      })
    })
  })
})
