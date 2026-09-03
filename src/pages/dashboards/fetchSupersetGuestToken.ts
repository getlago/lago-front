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

// The SDK derives its next refresh delay from the token we return, flooring at 5s
// once that token is expired (`guestTokenRefresh.js`). It awaits this callback
// before re-arming, so waiting inside it is the only lever we have to stop a
// failing mint from being re-invoked every 5s for as long as the tab is open.
const MAX_MINT_ATTEMPTS = 3
const RETRY_BACKOFF_MS = 1000
const STREAK_COOLDOWN_BASE_MS = 5000
const MAX_STREAK_COOLDOWN_MS = 5 * 60 * 1000

const SENTRY_TAGS = {
  errorType: 'SupersetGuestTokenMintError',
  component: 'fetchSupersetGuestToken',
}

export type FetchSupersetGuestToken = (() => Promise<string>) & { cancel: () => void }

// The SDK's refresh chain re-arms only from this callback's resolution and never
// observes a rejection (`index.js:150-156`), so never settling is the only way to
// halt it. Not a leak: the frame and the promise reference only each other.
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
    // GraphQL errors are already captured by the errorLink; only network errors
    // reach no other reporter.
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
    // Entry guard only: past here the call must settle even when cancelled, or a
    // cancel during the initial embed leaves `embedDashboard` unresolved with its
    // iframe already in the DOM (`index.js:146`).
    if (cancelled) return haltRefreshLoop()

    if (failureStreak > 0) {
      await sleep(streakCooldown(failureStreak))

      if (cancelled) return haltRefreshLoop()
    }

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

        // `guestToken` is non-null in the schema: an empty payload is a contract
        // violation, and there is no exception to attach.
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

    return lastToken
  }

  return Object.assign(fetchGuestToken, {
    cancel: (): void => {
      cancelled = true
      wakeSleeper?.()
    },
  })
}
