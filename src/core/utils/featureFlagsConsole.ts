import { AppEnvEnum } from '~/core/constants/globalTypes'
import { getEnableFeatureFlags, listFeatureFlags, setFeatureFlags } from '~/core/utils/featureFlags'

/**
 * Devtools console surface for the local feature flags. It is installed in every
 * environment so a flag can be enabled on production too, but only
 * non-production advertises it on load: on production it stays silent and is
 * reachable on demand through `window.Lago.help()`.
 */
export type LagoWindowApi = {
  getEnableFeatureFlags: typeof getEnableFeatureFlags
  setFeatureFlags: typeof setFeatureFlags
  listFeatureFlags: typeof listFeatureFlags
  help: () => void
}

export const printFeatureFlagsHelp = (): void => {
  const style = 'background: #eee; color: #fe3d3d'
  const flags = listFeatureFlags()
  const flagsSample = flags
    .slice(0, 2)
    .map((flag) => `'${flag}'`)
    .join(', ')

  const logs = [
    'List available flags: %c window.Lago.listFeatureFlags() ',
    `Set single flag: %c window.Lago.setFeatureFlags('${flags[0]}') `,
    `Set multiple flags: %c window.Lago.setFeatureFlags([${flagsSample}]) `,
    "Set all flags: %c window.Lago.setFeatureFlags('all') ",
    'Get enable flags: %c window.Lago.getEnableFeatureFlags() ',
    'Print this help again: %c window.Lago.help() ',
  ]

  /* eslint-disable no-console */
  console.groupCollapsed('%c window.Lago is available', style)
  logs.forEach((log) => console.info(log, style))
  console.groupEnd()
  /* eslint-enable no-console */
}

export const installLagoWindowApi = (appEnv: AppEnvEnum): void => {
  window.Lago = {
    getEnableFeatureFlags,
    setFeatureFlags,
    listFeatureFlags,
    help: printFeatureFlagsHelp,
  }

  if (appEnv !== AppEnvEnum.production) {
    printFeatureFlagsHelp()
  }
}
