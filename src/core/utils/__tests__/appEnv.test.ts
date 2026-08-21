import { AppEnvEnum } from '~/core/constants/globalTypes'
import { isDevOrQaAppEnv, isProductionAppEnv } from '~/core/utils/appEnv'

describe('appEnv', () => {
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
})
