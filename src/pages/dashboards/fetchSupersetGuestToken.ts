import { type ApolloClient, ApolloError, gql } from '@apollo/client'
import { captureException, captureMessage } from '@sentry/react'

import {
  CreateSupersetGuestTokenDocument,
  CreateSupersetGuestTokenMutation,
  CreateSupersetGuestTokenMutationVariables,
} from '~/generated/graphql'

gql`
  mutation createSupersetGuestToken($input: CreateSupersetGuestTokenInput!) {
    createSupersetGuestToken(input: $input) {
      guestToken
    }
  }
`

// The SDK derives the next refresh delay from whatever token we hand back
// (`guestTokenRefresh.js`): `ttl = max(MIN_REFRESH_WAIT_MS /* 10s */, exp - now)`,
// then `ttl - REFRESH_TIMING_BUFFER_MS /* 5s */`. Once the token we return is
// expired, `exp - now` is negative, so the delay floors at 5s — a mint that keeps
// failing would be re-invoked every 5s for as long as the tab stays open (~720
// mutations/hour, each one making the backend re-authenticate against Superset,
// which is the rate-limit pressure that broke renewal in the first place).
//
// The SDK awaits this callback before re-arming its timer, so waiting *inside* it
// is the only timing lever we have: retry a few times to ride out a transient
// blip, then let the failure streak stretch the cycle instead of hammering.
const MAX_MINT_ATTEMPTS = 3
const RETRY_BACKOFF_MS = 1000
const STREAK_COOLDOWN_BASE_MS = 5000
const MAX_STREAK_COOLDOWN_MS = 5 * 60 * 1000

const SENTRY_TAGS = {
  errorType: 'SupersetGuestTokenMintError',
  component: 'fetchSupersetGuestToken',
}

export type FetchSupersetGuestToken = (() => Promise<string>) & { cancel: () => void }

// Cancellation has to stop the SDK's refresh chain, and that chain only re-arms
// from the *resolution* of this callback — a rejection is never observed
// (`index.js:150-156`), it just yields an unhandled rejection while renewal dies
// anyway. A promise that never settles is therefore the only clean way to halt
// the loop. It is not a leak: the suspended frame and the promise reference each
// other and nothing else, so V8 collects the cycle.
const haltRefreshLoop = (): Promise<string> => new Promise<string>(() => {})

const streakCooldown = (streak: number): number =>
  Math.min(STREAK_COOLDOWN_BASE_MS * 2 ** (streak - 1), MAX_STREAK_COOLDOWN_MS)

export const createFetchSupersetGuestToken = (
  client: ApolloClient<object>,
  dashboardId: string,
  initialToken: string,
): FetchSupersetGuestToken => {
  let lastToken = initialToken
  let cancelled = false
  let failureStreak = 0
  let wakeSleeper: null | (() => void) = null

  // The SDK never overlaps calls (one mint for the initial embed, then a strictly
  // sequential refresh chain), so a single sleeper slot is enough. `cancel()`
  // wakes it so effect cleanup never waits out a backoff.
  const sleep = (ms: number): Promise<void> =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        wakeSleeper = null
        resolve()
      }, ms)

      wakeSleeper = () => {
        clearTimeout(timer)
        wakeSleeper = null
        resolve()
      }
    })

  const reportMintError = (error: unknown): void => {
    // GraphQL errors are already captured by the errorLink in
    // apolloClient/init.ts, so re-reporting them here would duplicate. Network
    // errors reach no other reporter — those are ours to surface.
    if (error instanceof ApolloError && error.graphQLErrors.length > 0) return

    captureException(error, { tags: SENTRY_TAGS, extra: { dashboardId } })
  }

  const mintToken = async (): Promise<string | undefined> => {
    const { data } = await client.mutate<
      CreateSupersetGuestTokenMutation,
      CreateSupersetGuestTokenMutationVariables
    >({
      mutation: CreateSupersetGuestTokenDocument,
      variables: { input: { dashboardId } },
      fetchPolicy: 'no-cache',
    })

    return data?.createSupersetGuestToken?.guestToken
  }

  const fetchGuestToken = async (): Promise<string> => {
    // Entry guard only. Past this point the call always settles, even when
    // `cancel()` fires mid-flight: during the initial embed the SDK awaits this
    // callback inside `Promise.all([fetchGuestToken(), mountIframe()])`
    // (`index.js:146`), and its iframe is in the DOM before that settles.
    // Hanging here would leave `embedDashboard` unresolved forever, so the effect
    // would never get the `EmbeddedDashboard` it needs to unmount that iframe and
    // close its Switchboard port.
    if (cancelled) return haltRefreshLoop()

    if (failureStreak > 0) {
      await sleep(streakCooldown(failureStreak))

      if (cancelled) return haltRefreshLoop()
    }

    // Only the first failure of a streak is reported: a sustained outage retries
    // for as long as the tab stays open, and one event per attempt would bury the
    // signal rather than surface it.
    const isFirstFailureOfStreak = (attempt: number): boolean =>
      failureStreak === 0 && attempt === 1

    for (let attempt = 1; attempt <= MAX_MINT_ATTEMPTS; attempt += 1) {
      try {
        const token = await mintToken()

        if (token) {
          failureStreak = 0
          lastToken = token

          return lastToken
        }

        // `guestToken` is non-null in the schema, so an empty payload is a
        // contract violation rather than an error response. There is no exception
        // to attach, hence captureMessage.
        if (isFirstFailureOfStreak(attempt)) {
          captureMessage('Superset guest token mutation returned no token', {
            level: 'error',
            tags: SENTRY_TAGS,
            extra: { dashboardId },
          })
        }
      } catch (error) {
        if (isFirstFailureOfStreak(attempt)) reportMintError(error)
      }

      if (cancelled) break

      if (attempt < MAX_MINT_ATTEMPTS) {
        await sleep(RETRY_BACKOFF_MS * 2 ** (attempt - 1))

        if (cancelled) break
      }
    }

    failureStreak += 1

    // Falling back to the last known good token keeps the SDK's chain alive so a
    // later refresh can still recover. That token is expired once the outage
    // outlasts it, which is exactly what the streak cooldown above is for.
    return lastToken
  }

  return Object.assign(fetchGuestToken, {
    cancel: (): void => {
      cancelled = true
      wakeSleeper?.()
    },
  })
}
