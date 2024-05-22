import { BrowserTracing } from '@sentry/browser'
import * as Sentry from '@sentry/react'
import { createRoot } from 'react-dom/client'

import App from '~/App'
import { envGlobalVar } from '~/core/apolloClient'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { getEnableFeatureFlags, listFeatureFlags, setFeatureFlags } from '~/core/utils/featureFlags'

import './main.css'

const { appEnv, sentryDsn } = envGlobalVar()

if (!!sentryDsn && appEnv !== AppEnvEnum.development) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [new BrowserTracing()],
    environment: appEnv,
  })
}

if (appEnv !== AppEnvEnum.production) {
  window.Lago = {
    getEnableFeatureFlags: getEnableFeatureFlags,
    setFeatureFlags: setFeatureFlags,
    listFeatureFlags: listFeatureFlags,
  }

  const style = 'background: #eee; color: #fe3d3d'
  const logs = [
    'List available flags: %c window.Lago.listFeatureFlags() ',
    "Set single flag: %c window.Lago.setFeatureFlags('ftr_xxx_enabled') ",
    "Set multiple flags: %c window.Lago.setFeatureFlags(['ftr_xxx_enabled', 'ftr_yyy_enabled']) ",
    "Set all flags: %c window.Lago.setFeatureFlags('all') ",
    'Get enable flags: %c window.Lago.getEnableFeatureFlags() ',
  ]

  /* eslint-disable no-console */
  console.groupCollapsed('%c window.Lago is available', style)
  logs.forEach((log) => console.info(log, style))
  console.groupEnd()
  /* eslint-enable no-console */
}

const container = document.getElementById('root')
const root = createRoot(container) // createRoot(container!) if you use TypeScript

root.render(<App />)

if (module.hot) {
  module.hot.accept()
}
