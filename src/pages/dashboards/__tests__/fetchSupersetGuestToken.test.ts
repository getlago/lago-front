import { type ApolloClient } from '@apollo/client'

import {
  CREATE_SUPERSET_GUEST_TOKEN,
  createFetchSupersetGuestToken,
} from '~/pages/dashboards/fetchSupersetGuestToken'

const makeClient = (mutate: jest.Mock) => ({ mutate }) as unknown as ApolloClient<object>

const PENDING = Symbol('pending')
const settledOrPending = (promise: Promise<unknown>) =>
  Promise.race([promise, Promise.resolve(PENDING)])

describe('createFetchSupersetGuestToken', () => {
  it('mints a fresh token on every call for the given dashboard', async () => {
    const mutate = jest
      .fn()
      .mockResolvedValueOnce({ data: { createSupersetGuestToken: { guestToken: 'token-1' } } })
      .mockResolvedValueOnce({ data: { createSupersetGuestToken: { guestToken: 'token-2' } } })
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42')

    expect(await fetchGuestToken()).toBe('token-1')
    expect(await fetchGuestToken()).toBe('token-2')

    expect(mutate).toHaveBeenCalledTimes(2)
    expect(mutate).toHaveBeenNthCalledWith(1, {
      mutation: CREATE_SUPERSET_GUEST_TOKEN,
      variables: { input: { dashboardId: '42' } },
      fetchPolicy: 'no-cache',
    })
  })

  it('falls back to the initial token when the mutation fails, keeping the refresh loop alive', async () => {
    const mutate = jest.fn().mockRejectedValue(new Error('network'))
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    await expect(fetchGuestToken()).resolves.toBe('initial-token')
  })

  it('keeps the most recent successful token when a later refresh fails', async () => {
    const mutate = jest
      .fn()
      .mockResolvedValueOnce({ data: { createSupersetGuestToken: { guestToken: 'token-1' } } })
      .mockRejectedValueOnce(new Error('rate limited'))
    const fetchGuestToken = createFetchSupersetGuestToken(makeClient(mutate), '42', 'initial-token')

    expect(await fetchGuestToken()).toBe('token-1')
    await expect(fetchGuestToken()).resolves.toBe('token-1')
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

  it('never resolves if cancelled while a mutation is in flight', async () => {
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

    expect(await settledOrPending(pending)).toBe(PENDING)
  })
})
