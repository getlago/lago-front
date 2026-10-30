import { ApolloClient } from '@apollo/client'

import { logOut, onLogIn, switchCurrentOrganization } from '../cacheUtils'

const mockSetCurrentOrganizationId = jest.fn()
const mockUpdateAuthTokenVar = jest.fn()
const mockAuthTokenVar = jest.fn()
const mockGetStoredAuthToken = (): string | undefined =>
  localStorage.getItem('auth_token') || undefined
const mockAddToast = jest.fn()
const mockPurgePersistedCache = jest.fn().mockResolvedValue(undefined)

const mockDisconnectCableConsumer = jest.fn()

jest.mock('../cableConsumer', () => ({
  disconnectCableConsumer: () => mockDisconnectCableConsumer(),
}))

jest.mock('../cachePersistor', () => ({
  pausePersistence: jest.fn(),
  resumePersistence: jest.fn(),
  purgePersistedCache: (...args: unknown[]) => mockPurgePersistedCache(...args),
}))

jest.mock('../reactiveVars', () => ({
  addToast: (...args: unknown[]) => mockAddToast(...args),
  AUTH_TOKEN_LS_KEY: 'auth_token',
  authTokenVar: (...args: unknown[]) => mockAuthTokenVar(...args),
  getStoredAuthToken: () => mockGetStoredAuthToken(),
  TMP_AUTH_TOKEN_LS_KEY: 'tmp_auth_token',
  setCurrentOrganizationId: (...args: unknown[]) => mockSetCurrentOrganizationId(...args),
  resetLocationHistoryVar: jest.fn(),
  updateAuthTokenVar: (...args: unknown[]) => mockUpdateAuthTokenVar(...args),
  updateCustomerPortalTokenVar: jest.fn(),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_AUTO_SAVE_KEY: 'devtool_auto_save',
  resetDevtoolsNavigation: jest.fn(),
}))

const createMockOrg = (
  overrides: { id?: string; name?: string; accessibleByCurrentSession?: boolean } = {},
) => ({
  id: overrides.id ?? 'org-1',
  name: overrides.name ?? 'Org One',
  timezone: 'TZ_UTC',
  accessibleByCurrentSession: overrides.accessibleByCurrentSession ?? true,
})

const createMockClient = (queryResponse?: unknown) =>
  ({
    stop: jest.fn(),
    clearStore: jest.fn().mockResolvedValue(undefined),
    resetStore: jest.fn().mockResolvedValue(undefined),
    reFetchObservableQueries: jest.fn().mockResolvedValue([]),
    query: jest.fn().mockResolvedValue(
      queryResponse ?? {
        data: {
          currentUser: {
            id: 'user-1',
            organizations: [createMockOrg()],
          },
        },
      },
    ),
  }) as unknown as ApolloClient<object>

describe('switchCurrentOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('GIVEN a valid organization id', () => {
    describe('WHEN switching to a new organization', () => {
      it('THEN should set the organization id via the reactive var', async () => {
        const client = createMockClient()

        await switchCurrentOrganization(client, 'org-new-123')

        expect(mockSetCurrentOrganizationId).toHaveBeenCalledWith('org-new-123')
      })

      it('THEN should clear the store BEFORE updating the organization id, then re-fire active observers AFTER the new org id is set', async () => {
        const client = createMockClient()
        const callOrder: string[] = []

        ;(client.clearStore as jest.Mock).mockImplementation(async () => {
          callOrder.push('clearStore')
        })
        mockSetCurrentOrganizationId.mockImplementation(() => {
          callOrder.push('setCurrentOrganizationId')
        })
        ;(client.reFetchObservableQueries as jest.Mock).mockImplementation(() => {
          callOrder.push('reFetchObservableQueries')
          return Promise.resolve([])
        })

        await switchCurrentOrganization(client, 'org-456')

        expect(callOrder).toEqual([
          'clearStore',
          'setCurrentOrganizationId',
          'reFetchObservableQueries',
        ])
      })

      it('THEN should purge the persisted blob without awaiting it (fire-and-forget keeps switch timing flash-free)', async () => {
        const client = createMockClient()

        await switchCurrentOrganization(client, 'org-456')

        expect(mockPurgePersistedCache).toHaveBeenCalledTimes(1)
      })
    })
  })
})

describe('onLogIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('WHEN login succeeds', () => {
    it('THEN sets the auth token and does NOT select/set a current org (RootRedirect owns landing)', async () => {
      const client = createMockClient({
        data: {
          currentUser: {
            id: 'user-1',
            organizations: [
              createMockOrg({ id: 'org-a', name: 'Alpha Corp' }),
              createMockOrg({ id: 'org-b', name: 'Beta Inc' }),
            ],
          },
        },
      })

      await onLogIn(client, 'token-123')

      expect(mockUpdateAuthTokenVar).toHaveBeenCalledWith('token-123')
      expect(mockSetCurrentOrganizationId).not.toHaveBeenCalled()
    })
  })

  describe('WHEN the current user cannot be fetched', () => {
    it('THEN shows a danger toast and does not set the auth token', async () => {
      const client = createMockClient()

      ;(client.query as jest.Mock).mockRejectedValue(new Error('Network error'))

      await onLogIn(client, 'token-123')

      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      expect(mockUpdateAuthTokenVar).not.toHaveBeenCalledWith('token-123')
    })
  })
})

describe('logOut', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockAuthTokenVar.mockReturnValue('session-jwt')
    localStorage.setItem('auth_token', 'session-jwt')
  })

  describe('WHEN this tab still owns the stored session', () => {
    it('THEN should clear the in-memory cache, then remove the token and purge the persisted blob', async () => {
      const client = createMockClient()
      const callOrder: string[] = []

      ;(client.stop as jest.Mock).mockImplementation(() => {
        callOrder.push('stop')
      })
      ;(client.clearStore as jest.Mock).mockImplementation(async () => {
        callOrder.push('clearStore')
      })
      mockPurgePersistedCache.mockImplementation(async () => {
        callOrder.push('purgePersistedCache')
      })

      await logOut(client)

      expect(callOrder).toEqual(['stop', 'clearStore', 'purgePersistedCache'])
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(mockAuthTokenVar).toHaveBeenLastCalledWith(undefined)
    })

    it('THEN should close the websocket opened with the previous token', async () => {
      await logOut(createMockClient())

      expect(mockDisconnectCableConsumer).toHaveBeenCalledTimes(1)
    })
  })

  describe('WHEN another tab stored a newer session during the teardown', () => {
    // An unconditional removal here let a stale 401 log every tab out of the newer session.
    it('THEN should keep that session and adopt it', async () => {
      const client = createMockClient()

      ;(client.clearStore as jest.Mock).mockImplementation(async () => {
        localStorage.setItem('auth_token', 'newer-session-jwt')
      })

      await logOut(client)

      expect(localStorage.getItem('auth_token')).toBe('newer-session-jwt')
      expect(mockPurgePersistedCache).not.toHaveBeenCalled()
      expect(mockAuthTokenVar).toHaveBeenLastCalledWith('newer-session-jwt')
    })
  })
})
