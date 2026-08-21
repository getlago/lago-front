import { captureMessage } from '@sentry/react'

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

// The fail-closed default above keeps a misconfigured deployment safe, but also silent:
// @sentry/core reports a missing `environment` as the string 'production', so events from a
// deployment that never set APP_ENV are indistinguishable from real production ones. Report it
// once at startup instead. `console.warn` covers deployments without a Sentry DSN, where
// `captureMessage` is a no-op.
export const reportMissingAppEnv = (appEnv: AppEnvEnum | undefined): void => {
  if (appEnv) return

  const message = 'APP_ENV is not set, the app defaults to production behavior'

  captureMessage(message, { level: 'warning' })
  // eslint-disable-next-line no-console
  console.warn(message)
}
