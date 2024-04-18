import { makeVar } from '@apollo/client'

import { AppEnvEnum } from '~/core/constants/globalTypes'

interface EnvGlobal {
  appEnv: AppEnvEnum
  apiUrl: string
  lagoOauthProxyUrl: string
  disableSignUp: boolean
  appVersion: string
  nangoPublicKey: string
  sentryDsn: string
}

export const envGlobalVar = makeVar<EnvGlobal>({
  appEnv: window.APP_ENV || APP_ENV,
  apiUrl: window.API_URL || API_URL,
  lagoOauthProxyUrl: window.LAGO_OAUTH_PROXY_URL || LAGO_OAUTH_PROXY_URL,
  disableSignUp: (window.LAGO_DISABLE_SIGNUP || LAGO_DISABLE_SIGNUP) === 'true',
  appVersion: APP_VERSION,
  nangoPublicKey: window.NANGO_PUBLIC_KEY || NANGO_PUBLIC_KEY,
  sentryDsn: window.SENTRY_DSN || SENTRY_DSN,
})
