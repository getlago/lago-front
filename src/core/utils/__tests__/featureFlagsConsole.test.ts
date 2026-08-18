import { AppEnvEnum } from '~/core/constants/globalTypes'
import { FeatureFlags } from '~/core/utils/featureFlags'
import { installLagoWindowApi, printFeatureFlagsHelp } from '~/core/utils/featureFlagsConsole'

const NON_PRODUCTION_ENVS = [AppEnvEnum.development, AppEnvEnum.qa, AppEnvEnum.staging]

describe('featureFlagsConsole', () => {
  let groupCollapsedSpy: jest.SpyInstance
  let infoSpy: jest.SpyInstance
  let groupEndSpy: jest.SpyInstance

  beforeEach(() => {
    localStorage.clear()
    groupCollapsedSpy = jest.spyOn(console, 'groupCollapsed').mockImplementation()
    infoSpy = jest.spyOn(console, 'info').mockImplementation()
    groupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('installLagoWindowApi', () => {
    it('exposes the api on production', () => {
      installLagoWindowApi(AppEnvEnum.production)

      expect(window.Lago.getEnableFeatureFlags).toBeInstanceOf(Function)
      expect(window.Lago.setFeatureFlags).toBeInstanceOf(Function)
      expect(window.Lago.listFeatureFlags).toBeInstanceOf(Function)
      expect(window.Lago.help).toBeInstanceOf(Function)
    })

    it('stays silent on production', () => {
      installLagoWindowApi(AppEnvEnum.production)

      expect(groupCollapsedSpy).not.toHaveBeenCalled()
      expect(infoSpy).not.toHaveBeenCalled()
      expect(groupEndSpy).not.toHaveBeenCalled()
    })

    it('lets a flag be enabled through the api on production', () => {
      installLagoWindowApi(AppEnvEnum.production)

      expect(window.Lago.setFeatureFlags(FeatureFlags.REVENUE_RECOGNITION)).toEqual([
        FeatureFlags.REVENUE_RECOGNITION,
      ])
      expect(window.Lago.getEnableFeatureFlags()).toEqual([FeatureFlags.REVENUE_RECOGNITION])
    })

    it.each(NON_PRODUCTION_ENVS)('prints the help on %s', (appEnv) => {
      installLagoWindowApi(appEnv)

      expect(groupCollapsedSpy).toHaveBeenCalledTimes(1)
      expect(groupEndSpy).toHaveBeenCalledTimes(1)
    })

    it('prints the help on demand once installed on production', () => {
      installLagoWindowApi(AppEnvEnum.production)

      window.Lago.help()

      expect(groupCollapsedSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('printFeatureFlagsHelp', () => {
    const getLoggedLines = (): string => infoSpy.mock.calls.map(([line]) => line).join('\n')

    it('documents every declared flag name', () => {
      printFeatureFlagsHelp()

      const logged = getLoggedLines()

      expect(logged).toContain(FeatureFlags.SUPERSET_PERSISTENT_FILTERS)
      expect(logged).toContain(FeatureFlags.REVENUE_RECOGNITION)
    })

    it('does not document flag names that do not exist', () => {
      printFeatureFlagsHelp()

      expect(getLoggedLines()).not.toContain('ftr_')
    })
  })
})
