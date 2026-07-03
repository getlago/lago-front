import { type ApolloClient } from '@apollo/client'

import {
  CREATE_SUPERSET_GUEST_TOKEN,
  createFetchSupersetGuestToken,
} from '~/pages/dashboards/fetchSupersetGuestToken'

describe('createFetchSupersetGuestToken', () => {
  it('mints a fresh token on every call for the given dashboard', async () => {
    const mutate = jest
      .fn()
      .mockResolvedValueOnce({ data: { createSupersetGuestToken: { guestToken: 'token-1' } } })
      .mockResolvedValueOnce({ data: { createSupersetGuestToken: { guestToken: 'token-2' } } })
    const client = { mutate } as unknown as ApolloClient<object>

    const fetchGuestToken = createFetchSupersetGuestToken(client, '42')

    expect(await fetchGuestToken()).toBe('token-1')
    expect(await fetchGuestToken()).toBe('token-2')

    expect(mutate).toHaveBeenCalledTimes(2)
    expect(mutate).toHaveBeenNthCalledWith(1, {
      mutation: CREATE_SUPERSET_GUEST_TOKEN,
      variables: { input: { dashboardId: '42' } },
      fetchPolicy: 'no-cache',
    })
  })

  it('returns an empty string when Superset returns no token', async () => {
    const mutate = jest.fn().mockResolvedValue({ data: null })
    const client = { mutate } as unknown as ApolloClient<object>

    const fetchGuestToken = createFetchSupersetGuestToken(client, '42')

    expect(await fetchGuestToken()).toBe('')
  })
})
