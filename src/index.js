import { BrowserTracing } from '@sentry/browser'
import * as Sentry from '@sentry/react'
import { createRoot } from 'react-dom/client'

import App from '~/App'
import { envGlobalVar } from '~/core/apolloClient'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { getEnableFeatureFlags, listFeatureFlags, setFeatureFlags } from '~/core/utils/featureFlags'

const { appEnv, sentryDsn } = envGlobalVar()

if (!!sentryDsn && appEnv !== AppEnvEnum.development) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [new BrowserTracing()],
    environment: appEnv,
  })
}

if (appEnv === AppEnvEnum.development) {
  window.Lago = {
    getEnableFeatureFlags: getEnableFeatureFlags,
    setFeatureFlags: setFeatureFlags,
    listFeatureFlags: listFeatureFlags,
  }
}

const container = document.getElementById('root')
const root = createRoot(container) // createRoot(container!) if you use TypeScript

root.render(<App />)

if (module.hot) {
  module.hot.accept()
}
