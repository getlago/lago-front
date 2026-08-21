import { AppEnvEnum } from '~/core/constants/globalTypes'

// `appEnv` comes from `window.APP_ENV || APP_ENV` and both sources can be empty: the Vite
// `define` is `void 0` when the build has no `APP_ENV`, and `.env.sh` writes an empty string
// when the deployment does not export it. Both helpers therefore fail closed on an unknown
// value: production behavior, nothing developer-facing opened by accident. Comparisons are
// written member by member (no `Array.includes`) so a new `AppEnvEnum` member also lands on
// the closed branch until it is handled explicitly.
export const isProductionAppEnv = (appEnv: AppEnvEnum | undefined): boolean =>
  appEnv !== AppEnvEnum.staging && appEnv !== AppEnvEnum.development && appEnv !== AppEnvEnum.qa

export const isDevOrQaAppEnv = (appEnv: AppEnvEnum | undefined): boolean =>
  appEnv === AppEnvEnum.development || appEnv === AppEnvEnum.qa
