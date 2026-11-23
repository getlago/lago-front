import type { envGlobalVar } from '~/core/apolloClient/reactiveVars/envGlobalVar'
import { CREATE_ORGANIZATION_ROUTE } from '~/core/router/paths/createOrganization'

import {
  buildAuthHeaders,
  buildCableConnectionParams,
  buildCableSubprotocols,
} from '../authHeaders'

type SelfServeFlag = Pick<ReturnType<typeof envGlobalVar>, 'selfServeEnabled'>

const mockGetCurrentOrganizationId = jest.fn()
const mockEnvGlobalVar = jest.fn<SelfServeFlag, []>()

jest.mock('../reactiveVars', () => ({
  AUTH_TOKEN_LS_KEY: 'auth_token',
  TMP_AUTH_TOKEN_LS_KEY: 'tmp_auth_token',
  envGlobalVar: () => mockEnvGlobalVar(),
  getCurrentOrganizationId: (...args: unknown[]) => mockGetCurrentOrganizationId(...args),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_AUTO_SAVE_KEY: 'devtool_auto_save',
  resetDevtoolsNavigation: jest.fn(),
}))

const PORTAL_TOKEN = 'portal-token-abc'
const PORTAL_PATH = `/customer-portal/${PORTAL_TOKEN}`
const ADMIN_PATH = '/acme/customers'
const SELF_SERVE_FLAGS: Array<[string, boolean]> = [
  ['on', true],
  ['off', false],
]

describe('buildAuthHeaders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockGetCurrentOrganizationId.mockReturnValue(null)
    mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: false })
  })

  describe('GIVEN a customer portal route', () => {
    describe('WHEN an admin session also exists', () => {
      it('THEN should send only the customer-portal-token carried by the path', () => {
        localStorage.setItem('auth_token', 'expired-admin-jwt')
        mockGetCurrentOrganizationId.mockReturnValue('org-123')

        const headers = buildAuthHeaders(PORTAL_PATH)

        expect(headers).toEqual({ 'customer-portal-token': PORTAL_TOKEN })
      })
    })

    describe('WHEN the path is a portal sub-route', () => {
      it('THEN should still resolve as a portal route', () => {
        localStorage.setItem('auth_token', 'expired-admin-jwt')

        expect(buildAuthHeaders(`${PORTAL_PATH}/usage/item-1`)).toEqual({
          'customer-portal-token': PORTAL_TOKEN,
        })
        expect(buildAuthHeaders(`${PORTAL_PATH}/wallet/wallet-1`)).toEqual({
          'customer-portal-token': PORTAL_TOKEN,
        })
      })
    })

    describe('WHEN two portals are open side by side', () => {
      // Regression: credentials used to come from localStorage, which every tab
      // shares, so opening customer Y's portal made customer X's tab send Y's token.
      it.each([
        ['the portal root', ''],
        ['a usage sub-route', '/usage/item-1'],
        ['a wallet sub-route', '/wallet/wallet-1'],
      ])('THEN each tab keeps its own token on %s', (_, suffix) => {
        expect(buildAuthHeaders(`/customer-portal/token-x${suffix}`)).toEqual({
          'customer-portal-token': 'token-x',
        })
        expect(buildAuthHeaders(`/customer-portal/token-y${suffix}`)).toEqual({
          'customer-portal-token': 'token-y',
        })
      })
    })

    describe('WHEN a portal token is left over in localStorage by an older build', () => {
      it('THEN should ignore it and use the path token', () => {
        localStorage.setItem('customerPortalToken', 'another-customers-token')

        expect(buildAuthHeaders(PORTAL_PATH)).toEqual({
          'customer-portal-token': PORTAL_TOKEN,
        })
      })
    })
  })

  describe.each(SELF_SERVE_FLAGS)(
    'GIVEN an admin route with the self-serve flag %s',
    (_, selfServeEnabled) => {
      beforeEach(() => {
        mockEnvGlobalVar.mockReturnValue({ selfServeEnabled })
      })

      describe('WHEN both an admin token and a portal token exist in localStorage', () => {
        it('THEN should send authorization and organization headers but never the portal token', () => {
          localStorage.setItem('auth_token', 'admin-jwt')
          localStorage.setItem('customer_portal_token', 'stale-portal-token')
          mockGetCurrentOrganizationId.mockReturnValue('org-123')

          expect(buildAuthHeaders(ADMIN_PATH)).toEqual({
            authorization: 'Bearer admin-jwt',
            'x-lago-organization': 'org-123',
          })
        })
      })

      describe('WHEN only the temporary auth token exists (login flow)', () => {
        it('THEN should use the temporary token as Bearer', () => {
          localStorage.setItem('tmp_auth_token', 'tmp-jwt')

          expect(buildAuthHeaders('/login')).toEqual({ authorization: 'Bearer tmp-jwt' })
        })
      })

      describe('WHEN both the auth token and the temporary token exist', () => {
        it('THEN should prefer the auth token', () => {
          localStorage.setItem('auth_token', 'admin-jwt')
          localStorage.setItem('tmp_auth_token', 'tmp-jwt')

          expect(buildAuthHeaders(ADMIN_PATH)).toEqual({ authorization: 'Bearer admin-jwt' })
        })
      })

      describe('WHEN no organization id is resolved', () => {
        it('THEN should omit the x-lago-organization header', () => {
          localStorage.setItem('auth_token', 'admin-jwt')
          mockGetCurrentOrganizationId.mockReturnValue(null)

          const headers = buildAuthHeaders(ADMIN_PATH)

          expect(headers).toEqual({ authorization: 'Bearer admin-jwt' })
          expect(headers).not.toHaveProperty('x-lago-organization')
        })
      })

      describe('WHEN no token exists at all', () => {
        it('THEN should send no headers', () => {
          expect(buildAuthHeaders(ADMIN_PATH)).toEqual({})
        })
      })
    },
  )

  describe('GIVEN the create organization route with an organization id still set from a previous session', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'admin-jwt')
      mockGetCurrentOrganizationId.mockReturnValue('org-123')
    })

    describe('WHEN the self-serve flag is on', () => {
      beforeEach(() => {
        mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: true })
      })

      it.each([CREATE_ORGANIZATION_ROUTE, '/create-organization/', '/Create-Organization'])(
        'THEN should send the Bearer without the x-lago-organization header on %s',
        (pathname) => {
          expect(buildAuthHeaders(pathname)).toEqual({ authorization: 'Bearer admin-jwt' })
        },
      )
    })

    describe('WHEN the self-serve flag is on and the path only starts like the create organization route', () => {
      beforeEach(() => {
        mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: true })
      })

      it.each(['/create-organization-x', '/create-organization/extra'])(
        'THEN should keep the x-lago-organization header on %s',
        (pathname) => {
          expect(buildAuthHeaders(pathname)).toEqual({
            authorization: 'Bearer admin-jwt',
            'x-lago-organization': 'org-123',
          })
        },
      )
    })

    describe('WHEN the self-serve flag is off', () => {
      it('THEN should keep the x-lago-organization header', () => {
        mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: false })

        expect(buildAuthHeaders(CREATE_ORGANIZATION_ROUTE)).toEqual({
          authorization: 'Bearer admin-jwt',
          'x-lago-organization': 'org-123',
        })
      })
    })
  })
})

describe('buildCableSubprotocols', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: false })
  })

  describe('WHEN an auth token exists', () => {
    it('THEN should send it as a lago-token subprotocol', () => {
      localStorage.setItem('auth_token', 'admin-jwt')
      localStorage.setItem('tmp_auth_token', 'tmp-jwt')

      expect(buildCableSubprotocols(ADMIN_PATH)).toEqual(['lago-token.admin-jwt'])
    })
  })

  describe('WHEN only the temporary token exists', () => {
    it('THEN should send the temporary token', () => {
      localStorage.setItem('tmp_auth_token', 'tmp-jwt')

      expect(buildCableSubprotocols(ADMIN_PATH)).toEqual(['lago-token.tmp-jwt'])
    })
  })

  describe('WHEN on a customer portal route', () => {
    it('THEN should not send the admin token', () => {
      localStorage.setItem('auth_token', 'admin-jwt')

      expect(buildCableSubprotocols(PORTAL_PATH)).toEqual([])
    })
  })

  describe('WHEN no token exists at all', () => {
    it('THEN should send no subprotocol', () => {
      expect(buildCableSubprotocols(ADMIN_PATH)).toEqual([])
    })
  })
})

describe('buildCableConnectionParams', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockGetCurrentOrganizationId.mockReturnValue(null)
    mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: false })
  })

  describe.each(SELF_SERVE_FLAGS)(
    'GIVEN an admin route with the self-serve flag %s',
    (_, selfServeEnabled) => {
      beforeEach(() => {
        mockEnvGlobalVar.mockReturnValue({ selfServeEnabled })
      })

      describe('WHEN an organization id exists', () => {
        it('THEN should send only the organization id, never the token', () => {
          localStorage.setItem('auth_token', 'admin-jwt')
          mockGetCurrentOrganizationId.mockReturnValue('org-123')

          expect(buildCableConnectionParams(ADMIN_PATH)).toEqual({ organization_id: 'org-123' })
        })
      })

      describe('WHEN no organization id is resolved', () => {
        it('THEN should send no params', () => {
          localStorage.setItem('auth_token', 'admin-jwt')

          expect(buildCableConnectionParams(ADMIN_PATH)).toEqual({})
        })
      })
    },
  )

  describe('WHEN on a customer portal route', () => {
    it('THEN should not send the admin organization id', () => {
      mockGetCurrentOrganizationId.mockReturnValue('org-123')

      expect(buildCableConnectionParams(PORTAL_PATH)).toEqual({})
    })
  })

  describe('GIVEN the create organization route with an organization id still set', () => {
    beforeEach(() => {
      localStorage.setItem('auth_token', 'admin-jwt')
      mockGetCurrentOrganizationId.mockReturnValue('org-123')
    })

    describe('WHEN the self-serve flag is on', () => {
      it('THEN should not send the organization id', () => {
        mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: true })

        expect(buildCableConnectionParams(CREATE_ORGANIZATION_ROUTE)).toEqual({})
      })
    })

    describe('WHEN the self-serve flag is off', () => {
      it('THEN should keep sending the organization id', () => {
        mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: false })

        expect(buildCableConnectionParams(CREATE_ORGANIZATION_ROUTE)).toEqual({
          organization_id: 'org-123',
        })
      })
    })
  })
})
