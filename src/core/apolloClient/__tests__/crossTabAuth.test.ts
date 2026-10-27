import { listenToCrossTabLogOut } from '../crossTabAuth'

const mockAuthTokenVar = jest.fn()

jest.mock('../reactiveVars', () => ({
  AUTH_TOKEN_LS_KEY: 'auth_token',
  TMP_AUTH_TOKEN_LS_KEY: 'tmp_auth_token',
  CUSTOMER_PORTAL_TOKEN_LS_KEY: 'customer_portal_token',
  getCurrentOrganizationId: jest.fn(),
  authTokenVar: () => mockAuthTokenVar(),
}))

const ADMIN_PATH = '/acme/customers'
const PORTAL_PATH = '/customer-portal/portal-token-abc'

const removeAuthToken = (): void => {
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'auth_token',
      newValue: null,
      storageArea: localStorage,
    }),
  )
}

describe('listenToCrossTabLogOut', () => {
  let onCrossTabLogOut: jest.Mock
  let stopListening: () => void

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockAuthTokenVar.mockReturnValue('admin-jwt')
    window.history.pushState({}, '', ADMIN_PATH)
    onCrossTabLogOut = jest.fn()
    stopListening = listenToCrossTabLogOut(onCrossTabLogOut)
  })

  afterEach(() => {
    stopListening()
  })

  describe('GIVEN an authenticated admin tab', () => {
    describe('WHEN another tab removes the auth token', () => {
      it('THEN should log this tab out', () => {
        removeAuthToken()

        expect(onCrossTabLogOut).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN another tab clears the whole localStorage', () => {
      it('THEN should log this tab out', () => {
        window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }))

        expect(onCrossTabLogOut).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN another tab writes a new auth token', () => {
      it('THEN should keep this tab signed in', () => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'auth_token',
            newValue: 'renewed-admin-jwt',
            storageArea: localStorage,
          }),
        )

        expect(onCrossTabLogOut).not.toHaveBeenCalled()
      })
    })

    describe('WHEN another tab removes an unrelated key', () => {
      it('THEN should keep this tab signed in', () => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'customer_portal_token',
            newValue: null,
            storageArea: localStorage,
          }),
        )

        expect(onCrossTabLogOut).not.toHaveBeenCalled()
      })
    })

    describe('WHEN that tab logged back in before the removal arrived', () => {
      // Both events are delivered; acting on the stale removal tore this tab's
      // cache down and signed it out of a session that is live again.
      it('THEN should keep this tab signed in', () => {
        localStorage.setItem('auth_token', 'new-session-jwt')

        removeAuthToken()

        expect(onCrossTabLogOut).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a same-origin frame clears its sessionStorage', () => {
      it('THEN should keep this tab signed in', () => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: null, storageArea: sessionStorage }),
        )

        expect(onCrossTabLogOut).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a customer portal page', () => {
    describe('WHEN another tab removes the auth token', () => {
      it('THEN should leave the portal session alone', () => {
        window.history.pushState({}, '', PORTAL_PATH)

        removeAuthToken()

        expect(onCrossTabLogOut).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a tab that is already signed out', () => {
    describe('WHEN another tab removes the auth token', () => {
      it('THEN should not log out again', () => {
        mockAuthTokenVar.mockReturnValue(undefined)

        removeAuthToken()

        expect(onCrossTabLogOut).not.toHaveBeenCalled()
      })
    })
  })

  describe('WHEN the listener has been stopped', () => {
    it('THEN should ignore further cross-tab logouts', () => {
      stopListening()

      removeAuthToken()

      expect(onCrossTabLogOut).not.toHaveBeenCalled()
    })
  })
})
