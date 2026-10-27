import { ApolloClient } from '@apollo/client'

import { logOut, logOutFromOtherTab } from '../cacheUtils'
import { authTokenVar } from '../reactiveVars'

let resolveTeardown: () => void = () => {}

jest.mock('../cableConsumer', () => ({ disconnectCableConsumer: jest.fn() }))

jest.mock('../cachePersistor', () => ({
  resetPersistedCache: () =>
    new Promise<void>((resolve) => {
      resolveTeardown = resolve
    }),
  purgePersistedCache: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_AUTO_SAVE_KEY: 'devtool_auto_save',
  resetDevtoolsNavigation: jest.fn(),
}))

const createMockClient = (): ApolloClient<object> =>
  ({
    stop: jest.fn(),
    clearStore: jest.fn().mockResolvedValue(undefined),
  }) as unknown as ApolloClient<object>

describe('logOutFromOtherTab', () => {
  beforeEach(() => {
    localStorage.clear()
    authTokenVar('old-session-jwt')
    localStorage.setItem('authToken', 'old-session-jwt')
  })

  describe('WHEN that tab logs back in while this one is still clearing its cache', () => {
    // Removing the shared key here deleted the new session and, through the
    // cross-tab listener, cascaded a logout back to every tab.
    it('THEN should leave the newer token in localStorage', async () => {
      const pending = logOutFromOtherTab(createMockClient())

      localStorage.setItem('authToken', 'new-session-jwt')
      resolveTeardown()
      await pending

      expect(localStorage.getItem('authToken')).toBe('new-session-jwt')
    })
  })

  describe('WHEN no other session appears', () => {
    it('THEN should drop the token from memory without touching localStorage', async () => {
      localStorage.setItem('unrelated', 'kept')

      const pending = logOutFromOtherTab(createMockClient())

      resolveTeardown()
      await pending

      expect(authTokenVar()).toBeUndefined()
      expect(localStorage.getItem('authToken')).toBe('old-session-jwt')
      expect(localStorage.getItem('unrelated')).toBe('kept')
    })
  })
})

describe('logOut', () => {
  beforeEach(() => {
    localStorage.clear()
    authTokenVar('old-session-jwt')
    localStorage.setItem('authToken', 'old-session-jwt')
  })

  describe('WHEN this tab is the one logging out', () => {
    it('THEN should still remove the shared token', async () => {
      const pending = logOut(createMockClient())

      resolveTeardown()
      await pending

      expect(localStorage.getItem('authToken')).toBeNull()
    })
  })
})
