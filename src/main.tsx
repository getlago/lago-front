import * as Sentry from '@sentry/react'
import React from 'react'
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
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: false,
      }),
    ],
    environment: appEnv,
    // Prevent sending recorded session if no error occurs
    replaysSessionSampleRate: 0.0,
    // Buffer (locally recorded) and send 30% of errors if one occurs
    replaysOnErrorSampleRate: 0.3,
    // Collect traces for 30% of sessions
    tracesSampleRate: 0.3,
  })

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', 'unhandledRejection')
      scope.setTag('location', 'window')
      Sentry.captureException(event.reason)
    })
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

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const container = document.getElementById('root')!

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
