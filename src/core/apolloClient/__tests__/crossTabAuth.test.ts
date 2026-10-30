import { ApolloClient } from '@apollo/client'

import { listenToSessionChanges, reconcileSession } from '../crossTabAuth'
import { authTokenVar } from '../reactiveVars'

const mockClearLocalSession = jest.fn()

jest.mock('../cacheUtils', () => ({
  clearLocalSession: (...args: unknown[]) => mockClearLocalSession(...args),
}))

const ADMIN_PATH = '/acme/customers'
const PORTAL_PATH = '/customer-portal/portal-token-abc'

const client = {} as ApolloClient<object>

const buildToken = (sub: string, exp: number): string =>
  `header.${btoa(JSON.stringify({ sub, exp }))}.signature`

const USER_A_TOKEN = buildToken('user-a', 1)
const USER_A_RENEWED_TOKEN = buildToken('user-a', 2)
const USER_B_TOKEN = buildToken('user-b', 1)

const dispatchStorage = (init: StorageEventInit): void => {
  window.dispatchEvent(new StorageEvent('storage', init))
}

describe('listenToSessionChanges', () => {
  let onChange: jest.Mock
  let stopListening: () => void

  beforeEach(() => {
    onChange = jest.fn()
    stopListening = listenToSessionChanges(onChange)
  })

  afterEach(() => {
    stopListening()
  })

  describe('WHEN another tab removes the auth token', () => {
    it('THEN should report a change', () => {
      dispatchStorage({ key: 'authToken', newValue: null, storageArea: localStorage })

      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('WHEN another tab stores a new auth token', () => {
    it('THEN should report a change', () => {
      dispatchStorage({ key: 'authToken', newValue: USER_B_TOKEN, storageArea: localStorage })

      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('WHEN another tab clears the whole localStorage', () => {
    it('THEN should report a change', () => {
      dispatchStorage({ key: null, storageArea: localStorage })

      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('WHEN another tab writes an unrelated key', () => {
    it('THEN should ignore it', () => {
      dispatchStorage({ key: 'customerPortalToken', newValue: null, storageArea: localStorage })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('WHEN a same-origin frame clears its sessionStorage', () => {
    it('THEN should ignore it', () => {
      dispatchStorage({ key: null, storageArea: sessionStorage })

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('WHEN the tab becomes visible again', () => {
    it('THEN should report a change', () => {
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')

      document.dispatchEvent(new Event('visibilitychange'))

      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('WHEN the tab is hidden', () => {
    it('THEN should ignore it', () => {
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')

      document.dispatchEvent(new Event('visibilitychange'))

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('WHEN the page is restored from the back-forward cache', () => {
    it('THEN should report a change', () => {
      const event = new Event('pageshow')

      Object.defineProperty(event, 'persisted', { value: true })
      window.dispatchEvent(event)

      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('WHEN the listener has been stopped', () => {
    it('THEN should ignore further changes', () => {
      stopListening()

      dispatchStorage({ key: 'authToken', newValue: null, storageArea: localStorage })

      expect(onChange).not.toHaveBeenCalled()
    })
  })
})

describe('reconcileSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    window.history.pushState({}, '', ADMIN_PATH)
    mockClearLocalSession.mockResolvedValue(undefined)
    authTokenVar(USER_A_TOKEN)
    localStorage.setItem('authToken', USER_A_TOKEN)
  })

  describe('GIVEN the tab is in sync with localStorage', () => {
    it('THEN should leave the session alone', async () => {
      await reconcileSession(client)

      expect(mockClearLocalSession).not.toHaveBeenCalled()
      expect(authTokenVar()).toBe(USER_A_TOKEN)
    })
  })

  describe('GIVEN another tab logged out', () => {
    it('THEN should clear this tab and sign it out', async () => {
      localStorage.removeItem('authToken')

      await reconcileSession(client)

      expect(mockClearLocalSession).toHaveBeenCalledWith(client)
      expect(authTokenVar()).toBeUndefined()
    })
  })

  describe('GIVEN another tab signed in with a different account', () => {
    it('THEN should clear this tab and reload it instead of adopting the session in place', async () => {
      localStorage.setItem('authToken', USER_B_TOKEN)

      await reconcileSession(client)

      expect(mockClearLocalSession).toHaveBeenCalledTimes(1)
      expect(authTokenVar()).toBe(USER_A_TOKEN)
    })
  })

  describe('GIVEN this tab is signed out and another tab signs in', () => {
    it('THEN should adopt the new session', async () => {
      authTokenVar(undefined)
      localStorage.setItem('authToken', USER_B_TOKEN)

      await reconcileSession(client)

      expect(mockClearLocalSession).toHaveBeenCalledTimes(1)
      expect(authTokenVar()).toBe(USER_B_TOKEN)
    })
  })

  describe('GIVEN another tab received a renewed token for the same user', () => {
    // Treating renewal as a new session tore every other tab down once per renewal.
    it('THEN should adopt it without clearing this tab', async () => {
      localStorage.setItem('authToken', USER_A_RENEWED_TOKEN)

      await reconcileSession(client)

      expect(mockClearLocalSession).not.toHaveBeenCalled()
      expect(authTokenVar()).toBe(USER_A_RENEWED_TOKEN)
    })
  })

  describe('GIVEN a customer portal page', () => {
    it('THEN should sync the token without clearing the portal cache', async () => {
      window.history.pushState({}, '', PORTAL_PATH)
      localStorage.removeItem('authToken')

      await reconcileSession(client)

      expect(mockClearLocalSession).not.toHaveBeenCalled()
      expect(authTokenVar()).toBeUndefined()
    })
  })

  describe('GIVEN a reconcile is already running', () => {
    it('THEN should not start a second teardown', async () => {
      localStorage.removeItem('authToken')

      await Promise.all([reconcileSession(client), reconcileSession(client)])

      expect(mockClearLocalSession).toHaveBeenCalledTimes(1)
    })
  })

  describe('GIVEN another tab stores a session while this one is clearing', () => {
    it('THEN should reload instead of adopting the latest stored session in place', async () => {
      localStorage.removeItem('authToken')
      mockClearLocalSession.mockImplementation(async () => {
        localStorage.setItem('authToken', USER_B_TOKEN)
      })

      await reconcileSession(client)

      expect(authTokenVar()).toBe(USER_A_TOKEN)
    })
  })
})
