import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

import App from '~/App'

import { AppEnvEnum } from './globalTypes'

if (APP_ENV !== AppEnvEnum.development) {
  Sentry.init({
    dsn: 'https://3dedf10cc2614403886aa3784388a366@o554090.ingest.sentry.io/6458937',
    integrations: [new BrowserTracing()],
    environment: APP_ENV,
  })
}

const container = document.getElementById('root')
const root = createRoot(container) // createRoot(container!) if you use TypeScript

root.render(<App />)

if (module.hot) {
  module.hot.accept()
}
