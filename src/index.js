import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

import App from '~/App'
import { envGlobalVar } from '~/core/apolloClient'
import { AppEnvEnum } from '~/core/constants/globalTypes'

const { appEnv, sentryDsn } = envGlobalVar()

if (!!sentryDsn && appEnv !== AppEnvEnum.development) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [new BrowserTracing()],
    environment: appEnv,
  })
}

const container = document.getElementById('root')
const root = createRoot(container) // createRoot(container!) if you use TypeScript

root.render(<App />)

if (module.hot) {
  module.hot.accept()
}
