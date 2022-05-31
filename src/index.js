import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

import App from '~/App'

if (!IS_DEV_ENV) {
  Sentry.init({
    dsn: 'https://3dedf10cc2614403886aa3784388a366@o554090.ingest.sentry.io/6458937',
    integrations: [new BrowserTracing()],
    environment: APP_ENV,
  })
}

ReactDOM.render(<App />, document.getElementById('root'))

if (module.hot) {
  module.hot.accept()
}
