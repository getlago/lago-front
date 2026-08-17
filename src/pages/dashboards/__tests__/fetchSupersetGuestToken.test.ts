import { type ApolloClient, ApolloError } from '@apollo/client'
import { GraphQLError } from 'graphql'

import { CreateSupersetGuestTokenDocument } from '~/generated/graphql'
import { createFetchSupersetGuestToken } from '~/pages/dashboards/fetchSupersetGuestToken'

const mockCaptureException = jest.fn()
const mockCaptureMessage = jest.fn()

jest.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}))

const makeClient = (mutate: jest.Mock) => ({ mutate }) as unknown as ApolloClient<object>

// Retry backoff within a single invocation: 1s after attempt 1, 2s after attempt 2.
const FIRST_RETRY_BACKOFF_MS = 1000
const SECOND_RETRY_BACKOFF_MS = 2000
const ALL_RETRY_BACKOFFS_MS = FIRST_RETRY_BACKOFF_MS + SECOND_RETRY_BACKOFF_MS
const FIRST_STREAK_COOLDOWN_MS = 5000
const MAX_MINT_ATTEMPTS = 3

const SENTRY_TAGS = {
  errorType: 'SupersetGuestTokenMintError',
  component: 'fetchSupersetGuestToken',
}

const tokenResponse = (guestToken: string | null) => ({
  data: { createSupersetGuestToken: { guestToken } },
})

// Whether `promise` has settled once microtasks and 0ms timers have flushed.
// Racing against an already-resolved sentinel instead would always pick the
// sentinel, so such an assertion could never fail.
const hasSettled = async (promise: Promise<unknown>): Promise<boolean> => {
  let settled = false

  promise.then(
    () => {
      settled = true
    },
    () => {
      settled = true
    },
  )

  await jest.advanceTimersByTimeAsync(0)

  return settled
}

// Drives one fully-failing invocation (all attempts + their backoffs) to settlement.
const drainFailedInvocation = async (pending: Promise<string>): Promise<string> => {
  await jest.advanceTimersByTimeAsync(ALL_RETRY_BACKOFFS_MS)

  return pending
}

describe('createFetchSupersetGuestToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('mints a fresh token on every call for the given dashboard', async () => {
    const mutate = jest
      .fn()
      .mockResolvedValueOnce(tokenResponse('token-1'))
      .mockResolvedValueOnce(tokenResponse('token-2'))
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    expect(await fetchGuestToken()).toBe('token-1')
    expect(await fetchGuestToken()).toBe('token-2')

    expect(mutate).toHaveBeenCalledTimes(2)
    expect(mutate).toHaveBeenNthCalledWith(1, {
      mutation: CreateSupersetGuestTokenDocument,
      variables: { input: { dashboardId: '42' } },
      fetchPolicy: 'no-cache',
    })
  })

  describe('GIVEN the mutation keeps failing', () => {
    it('THEN retries with a growing backoff, capped, before falling back to the last token', async () => {
      const mutate = jest.fn().mockRejectedValue(new Error('network'))
      const fetchGuestToken = createFetchSupersetGuestToken(
        makeClient(mutate),
        '42',
        'initial-token',
      )

      const pending = fetchGuestToken()

      await jest.advanceTimersByTimeAsync(0)
      expect(mutate).toHaveBeenCalledTimes(1)

      // No further attempt until the first backoff has elapsed.
      await jest.advanceTimersByTimeAsync(FIRST_RETRY_BACKOFF_MS - 1)
      expect(mutate).toHaveBeenCalledTimes(1)

      await jest.advanceTimersByTimeAsync(1)
      expect(mutate).toHaveBeenCalledTimes(2)

      await jest.advanceTimersByTimeAsync(SECOND_RETRY_BACKOFF_MS)
      expect(mutate).toHaveBeenCalledTimes(MAX_MINT_ATTEMPTS)

      await expect(pending).resolves.toBe('initial-token')
      expect(mutate).toHaveBeenCalledTimes(MAX_MINT_ATTEMPTS)
    })

    it('THEN cools down before the next invocation instead of re-minting every 5s', async () => {
      const mutate = jest.fn().mockRejectedValue(new Error('network'))
      const fetchGuestToken = createFetchSupersetGuestToken(
        makeClient(mutate),
        '42',
        'initial-token',
      )

      await drainFailedInvocation(fetchGuestToken())
      expect(mutate).toHaveBeenCalledTimes(MAX_MINT_ATTEMPTS)

      // The SDK re-invokes us ~5s after we hand back an expired token. That call
      // must not immediately hit the endpoint again.
      const second = fetchGuestToken()

      await jest.advanceTimersByTimeAsync(FIRST_STREAK_COOLDOWN_MS - 1)
      expect(mutate).toHaveBeenCalledTimes(MAX_MINT_ATTEMPTS)

      await jest.advanceTimersByTimeAsync(1)
      expect(mutate).toHaveBeenCalledTimes(MAX_MINT_ATTEMPTS + 1)

      await drainFailedInvocation(second)
    })

    it('THEN reports the first failure of the streak once, and stays quiet afterwards', async () => {
      const mutate = jest.fn().mockRejectedValue(new TypeError('offline'))
      const fetchGuestToken = createFetchSupersetGuestToken(
        makeClient(mutate),
        '42',
        'initial-token',
      )

      await drainFailedInvocation(fetchGuestToken())

      expect(mockCaptureException).toHaveBeenCalledTimes(1)
      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(TypeError), {
        tags: SENTRY_TAGS,
        extra: { dashboardId: '42' },
      })

      const second = fetchGuestToken()

      await jest.advanceTimersByTimeAsync(FIRST_STREAK_COOLDOWN_MS)
      await drainFailedInvocation(second)

      expect(mockCaptureException).toHaveBeenCalledTimes(1)
    })

    it('THEN leaves GraphQL errors to the errorLink rather than reporting them twice', async () => {
      const mutate = jest
        .fn()
        .mockRejectedValue(new ApolloError({ graphQLErrors: [new GraphQLError('forbidden')] }))
      const fetchGuestToken = createFetchSupersetGuestToken(
        makeClient(mutate),
        '42',
        'initial-token',
      )

      await drainFailedInvocation(fetchGuestToken())

      expect(mockCaptureException).not.toHaveBeenCalled()
    })
  })

  it('keeps the most recent successful token when a later refresh fails', async () => {
    const mutate = jest
      .fn()
      .mockResolvedValueOnce(tokenResponse('token-1'))
      .mockRejectedValue(new Error('rate limited'))
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    expect(await fetchGuestToken()).toBe('token-1')

    await expect(drainFailedInvocation(fetchGuestToken())).resolves.toBe('token-1')
  })

  it('mints immediately again once a token comes back, dropping the cooldown', async () => {
    const mutate = jest
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(tokenResponse('token-recovered'))
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    // Attempt 1 fails, attempt 2 recovers within the same invocation.
    const recovering = fetchGuestToken()

    await jest.advanceTimersByTimeAsync(FIRST_RETRY_BACKOFF_MS)
    await expect(recovering).resolves.toBe('token-recovered')

    // Streak is reset, so the next invocation mints without waiting.
    await expect(fetchGuestToken()).resolves.toBe('token-recovered')
    expect(mutate).toHaveBeenCalledTimes(3)
  })

  it('treats a token-less response as a contract violation: reports, retries, falls back', async () => {
    const mutate = jest.fn().mockResolvedValue(tokenResponse(null))
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    await expect(drainFailedInvocation(fetchGuestToken())).resolves.toBe('initial-token')

    expect(mutate).toHaveBeenCalledTimes(MAX_MINT_ATTEMPTS)
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1)
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'Superset guest token mutation returned no token',
      { level: 'error', tags: SENTRY_TAGS, extra: { dashboardId: '42' } },
    )
  })

  describe('GIVEN the fetcher is cancelled', () => {
    it('THEN never resolves and stops hitting the mutation', async () => {
      const mutate = jest.fn().mockResolvedValue(tokenResponse('token-1'))
      const fetchGuestToken = createFetchSupersetGuestToken(
        makeClient(mutate),
        '42',
        'initial-token',
      )

      fetchGuestToken.cancel()

      expect(await hasSettled(fetchGuestToken())).toBe(false)
      expect(mutate).not.toHaveBeenCalled()
    })

    // A call already in flight MUST settle. The SDK awaits this callback inside
    // `Promise.all([fetchGuestToken(), mountIframe()])` during the initial embed,
    // so hanging here leaves `embedDashboard` unresolved and its already-mounted
    // iframe orphaned, with no handle for the effect cleanup to unmount.
    it('THEN still settles a call that was already in flight', async () => {
      let resolveMutate: (value: unknown) => void = () => {}
      const mutate = jest.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveMutate = resolve
        }),
      )
      const fetchGuestToken = createFetchSupersetGuestToken(
        makeClient(mutate),
        '42',
        'initial-token',
      )

      const pending = fetchGuestToken()

      fetchGuestToken.cancel()
      resolveMutate(tokenResponse('token-late'))

      await expect(pending).resolves.toBe('token-late')
    })

    // Without waking the sleeper this would sit on the remaining backoff, so the
    // assertion below would time out rather than resolve.
    it('THEN abandons a pending retry backoff immediately', async () => {
      const mutate = jest.fn().mockRejectedValue(new Error('network'))
      const fetchGuestToken = createFetchSupersetGuestToken(
        makeClient(mutate),
        '42',
        'initial-token',
      )

      const pending = fetchGuestToken()

      await jest.advanceTimersByTimeAsync(0)
      expect(mutate).toHaveBeenCalledTimes(1)

      fetchGuestToken.cancel()

      await expect(pending).resolves.toBe('initial-token')
      expect(mutate).toHaveBeenCalledTimes(1)
    })
  })
})
