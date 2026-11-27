import type { BrowserOptions } from '@sentry/react'

import { scrubUrlTokens } from '~/core/utils/sentryUrlTokens'
import { dropRecoverableWorkerLoadEvent } from '~/core/utils/workerLoadRecovery'

type SentryEventHooks = Pick<BrowserOptions, 'beforeSend' | 'beforeSendSpan'>

// Page URLs and GraphQL variables carry auth tokens: reset password, invitation, portal, OAuth.
// No `beforeSendTransaction`: it's a no-op under v11's default `stream` trace lifecycle.
export const sentryEventHooks: SentryEventHooks = {
  beforeSend: (event) => scrubUrlTokens(dropRecoverableWorkerLoadEvent(event)),
  beforeSendSpan: scrubUrlTokens,
}
