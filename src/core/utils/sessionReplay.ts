import { getClient, replayIntegration } from '@sentry/react'

import { hasUrlToken, scrubUrlTokens } from '~/core/utils/sentryUrlTokens'

type ReplayIntegration = ReturnType<typeof replayIntegration>

const REPLAY_INTEGRATION_NAME = 'Replay'

const createReplayIntegration = (): ReplayIntegration =>
  replayIntegration({
    maskAllText: false,
    blockAllMedia: false,
    maskAllInputs: false,
    // Replay only hands custom events (breadcrumbs, navigation spans) to this hook
    beforeAddRecordingEvent: scrubUrlTokens,
  })

// Snapshots embed `location.href` and the DOM, which no SDK hook can rewrite. Token pages are
// only reached by a full page load, so starting at the next route change is enough.
const isCurrentUrlSafe = (): boolean => !hasUrlToken(window.location.href)

export const getInitialReplayIntegrations = (): ReplayIntegration[] =>
  isCurrentUrlSafe() ? [createReplayIntegration()] : []

// `addIntegration` keeps `replaysOnErrorSampleRate`, unlike `replay.startBuffering()`
export const startSessionReplayOnceUrlIsSafe = (): void => {
  const client = getClient()

  if (!client || client.getIntegrationByName(REPLAY_INTEGRATION_NAME) || !isCurrentUrlSafe()) {
    return
  }

  client.addIntegration(createReplayIntegration())
}
