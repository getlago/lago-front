import { ApolloClient, ApolloLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client'
import { act, renderHook } from '@testing-library/react'
import { parse } from 'graphql'
import localForage from 'localforage'

import { useCrossTabSession } from '~/hooks/auth/useCrossTabSession'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'

import { disconnectCableConsumer } from '../cableConsumer'
import { cache } from '../cache'
import { pausePersistence, resumePersistence, setupCachePersistor } from '../cachePersistor'
import { onLogIn } from '../cacheUtils'
import { reconcileSession } from '../crossTabAuth'
import { authTokenVar } from '../reactiveVars'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('../crossTabAuth'),
  ...jest.requireMock('../reactiveVars'),
}))

jest.mock('../cache', () => ({
  cache: new (jest.requireActual('@apollo/client').InMemoryCache)(),
}))

jest.mock('localforage', () => ({
  __esModule: true,
  default: {
    keys: jest.fn().mockResolvedValue([]),
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('../cableConsumer', () => ({ disconnectCableConsumer: jest.fn() }))
jest.mock('~/hooks/useDeveloperTool', () => ({ resetDevtoolsNavigation: jest.fn() }))
jest.mock('../reactiveVars', () => ({
  AUTH_TOKEN_LS_KEY: 'authToken',
  TMP_AUTH_TOKEN_LS_KEY: 'tmpAuthToken',
  authTokenVar: jest.requireActual('@apollo/client').makeVar(undefined),
  customerPortalTokenVar: jest.requireActual('@apollo/client').makeVar(undefined),
  getStoredAuthToken: (): string | undefined =>
    globalThis.localStorage.getItem('authToken') || undefined,
  updateAuthTokenVar: jest.fn(),
  resetLocationHistoryVar: jest.fn(),
}))

const CACHE_KEY = 'apollo-cache-persist-lago-session-test'
// Parsed from a string so codegen does not pick it up as an app operation.
const MARKER_QUERY = parse(`
  query PersistenceMarker {
    marker
  }
`)

const writeMarker = (target: InMemoryCache, marker: string): void => {
  target.writeQuery({ query: MARKER_QUERY, data: { marker } })
}

describe('session persistence', () => {
  let client: ApolloClient<NormalizedCacheObject>

  beforeEach(async () => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    localStorage.clear()
    window.history.pushState({}, '', '/acme/customers')
    await cache.reset()
    await setupCachePersistor('session-test')
    client = new ApolloClient({ cache, link: ApolloLink.empty() })
    authTokenVar('old-token')
  })

  afterEach(() => {
    pausePersistence()
    client.stop()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('signs out the UI and clears local data and sockets on a remote logout without a request', async () => {
    localStorage.setItem('authToken', 'old-token')
    writeMarker(cache, 'old session')
    const stop = jest.spyOn(client, 'stop')
    const { result, unmount } = renderHook(() => {
      useCrossTabSession(client)

      return useIsAuthenticated()
    })

    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      localStorage.removeItem('authToken')
      const event = new Event('storage')

      Object.defineProperties(event, {
        key: { value: 'authToken' },
        storageArea: { value: localStorage },
      })
      window.dispatchEvent(event)
      await reconcileSession(client)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(cache.extract()).toEqual({})
    expect(stop).toHaveBeenCalledTimes(1)
    expect(disconnectCableConsumer).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1000)
    expect(localForage.setItem).not.toHaveBeenCalled()
    expect(localForage.removeItem).not.toHaveBeenCalled()
    unmount()
  })

  it.each([
    {
      title: 'signs out on a remote logout',
      sessionToken: 'old-token',
      storedToken: undefined,
      expectedToken: undefined,
      resumes: false,
    },
    {
      title: 'adopts a login from another tab while signed out',
      sessionToken: undefined,
      storedToken: 'new-token',
      expectedToken: 'new-token',
      resumes: true,
    },
    {
      title: 'reloads when another account replaces the session',
      sessionToken: 'old-token',
      storedToken: 'new-token',
      expectedToken: 'old-token',
      resumes: false,
    },
  ])(
    'preserves the shared blob with a pending write when this tab $title',
    async ({ sessionToken, storedToken, expectedToken, resumes }) => {
      authTokenVar(sessionToken)
      writeMarker(cache, 'old session')
      if (storedToken) localStorage.setItem('authToken', storedToken)

      await reconcileSession(client)

      const sharedBlob = JSON.stringify({ ROOT_QUERY: { marker: 'another tab session' } })

      await localForage.setItem(CACHE_KEY, sharedBlob)
      await jest.advanceTimersByTimeAsync(1000)

      expect(localForage.setItem).toHaveBeenCalledTimes(1)
      expect(localForage.setItem).toHaveBeenLastCalledWith(CACHE_KEY, sharedBlob)
      expect(localForage.removeItem).not.toHaveBeenCalled()
      expect(authTokenVar()).toBe(expectedToken)

      writeMarker(cache, 'new session')
      await jest.advanceTimersByTimeAsync(1000)

      expect(localForage.setItem).toHaveBeenCalledTimes(resumes ? 2 : 1)
      if (resumes) {
        expect(localForage.setItem).toHaveBeenLastCalledWith(
          CACHE_KEY,
          JSON.stringify(cache.extract()),
        )
      }
    },
  )

  it('resumes future writes after a successful login without reviving the old timer', async () => {
    writeMarker(cache, 'old session')
    await reconcileSession(client)
    jest.spyOn(client, 'query').mockResolvedValue({ data: {}, loading: false, networkStatus: 7 })

    await onLogIn(client, 'new-token')
    await jest.advanceTimersByTimeAsync(1000)

    expect(localForage.setItem).not.toHaveBeenCalled()

    writeMarker(cache, 'new session')
    await jest.advanceTimersByTimeAsync(1000)

    expect(localForage.setItem).toHaveBeenCalledWith(CACHE_KEY, JSON.stringify(cache.extract()))
  })

  it('keeps persistence disabled in the customer portal', async () => {
    writeMarker(cache, 'old session')
    pausePersistence()
    window.history.pushState({}, '', '/customer-portal/token')
    resumePersistence()
    writeMarker(cache, 'portal session')
    await jest.advanceTimersByTimeAsync(1000)

    expect(localForage.setItem).not.toHaveBeenCalled()
  })
})
