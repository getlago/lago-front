import type { BrowserOptions } from '@sentry/react'

import { scrubUrlTokens } from '~/core/utils/sentryUrlTokens'
import { dropRecoverableWorkerLoadEvent } from '~/core/utils/workerLoadRecovery'

type SentryEventHooks = Pick<
  BrowserOptions,
  'beforeSend' | 'beforeSendTransaction' | 'beforeSendSpan'
>

// Page URLs and GraphQL variables carry auth tokens: reset password, invitation, portal, OAuth
export const sentryEventHooks: SentryEventHooks = {
  beforeSend: (event) => scrubUrlTokens(dropRecoverableWorkerLoadEvent(event)),
  beforeSendTransaction: scrubUrlTokens,
  beforeSendSpan: scrubUrlTokens,
}
