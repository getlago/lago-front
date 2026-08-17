import { type ApolloClient } from '@apollo/client'

import { CreateSupersetGuestTokenDocument } from '~/generated/graphql'
import { createFetchSupersetGuestToken } from '~/pages/dashboards/fetchSupersetGuestToken'

const mockCaptureException = jest.fn()
const mockCaptureMessage = jest.fn()

jest.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}))

const makeClient = (mutate: jest.Mock) => ({ mutate }) as unknown as ApolloClient<object>

const PENDING = Symbol('pending')
const settledOrPending = (promise: Promise<unknown>) =>
  Promise.race([promise, Promise.resolve(PENDING)])

// Retry backoff inside one invocation: 1s after attempt 1, 2s after attempt 2.
const ALL_RETRY_BACKOFFS_MS = 3000

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
      .mockResolvedValueOnce({ data: { createSupersetGuestToken: { guestToken: 'token-1' } } })
      .mockResolvedValueOnce({ data: { createSupersetGuestToken: { guestToken: 'token-2' } } })
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

  it('falls back to the initial token when the mutation fails, keeping the refresh loop alive', async () => {
    const mutate = jest.fn().mockRejectedValue(new Error('network'))
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    const pending = fetchGuestToken()

    await jest.advanceTimersByTimeAsync(ALL_RETRY_BACKOFFS_MS)

    await expect(pending).resolves.toBe('initial-token')
  })

  it('keeps the most recent successful token when a later refresh fails', async () => {
    const mutate = jest
      .fn()
      .mockResolvedValueOnce({ data: { createSupersetGuestToken: { guestToken: 'token-1' } } })
      .mockRejectedValue(new Error('rate limited'))
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    expect(await fetchGuestToken()).toBe('token-1')

    const pending = fetchGuestToken()

    await jest.advanceTimersByTimeAsync(ALL_RETRY_BACKOFFS_MS)

    await expect(pending).resolves.toBe('token-1')
  })

  it('never resolves and stops hitting the mutation once cancelled', async () => {
    const mutate = jest
      .fn()
      .mockResolvedValue({ data: { createSupersetGuestToken: { guestToken: 'token-1' } } })
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    fetchGuestToken.cancel()

    expect(await settledOrPending(fetchGuestToken())).toBe(PENDING)
    expect(mutate).not.toHaveBeenCalled()
  })

  // Inverted deliberately: a call already in flight MUST settle. The SDK awaits
  // this callback inside `Promise.all([fetchGuestToken(), mountIframe()])` during
  // the initial embed, so hanging here leaves `embedDashboard` unresolved and its
  // already-mounted iframe orphaned, with no handle for the effect to unmount.
  it('settles a call that was already in flight when cancelled', async () => {
    let resolveMutate: (value: unknown) => void = () => {}
    const mutate = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveMutate = resolve
      }),
    )
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    const pending = fetchGuestToken()

    fetchGuestToken.cancel()
    resolveMutate({ data: { createSupersetGuestToken: { guestToken: 'token-late' } } })

    await expect(pending).resolves.toBe('token-late')
  })
})
