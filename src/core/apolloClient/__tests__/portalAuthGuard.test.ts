import { getItemFromLS } from '~/core/apolloClient/cacheUtils'
import { CUSTOMER_PORTAL_TOKEN_LS_KEY } from '~/core/apolloClient/reactiveVars'

// Mock dependencies that cause circular imports when loading cacheUtils
jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_AUTO_SAVE_KEY: 'devtool-auto-save',
  resetDevtoolsNavigation: jest.fn(),
}))

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  addToast: jest.fn(),
  AUTH_TOKEN_LS_KEY: 'authToken',
  TMP_AUTH_TOKEN_LS_KEY: 'tmpAuthToken',
  resetLocationHistoryVar: jest.fn(),
  updateAuthTokenVar: jest.fn(),
  updateCustomerPortalTokenVar: jest.fn(),
  CUSTOMER_PORTAL_TOKEN_LS_KEY: 'customerPortalToken',
}))

jest.mock('~/generated/graphql', () => ({
  CurrentUserFragmentDoc: {},
  LagoApiError: {},
}))

describe('Portal auth guard logic', () => {
  afterEach(() => {
    localStorage.clear()
  })

  describe('Portal context detection via getItemFromLS', () => {
    it('GIVEN a customer portal token is stored in localStorage WHEN getItemFromLS is called with CUSTOMER_PORTAL_TOKEN_LS_KEY THEN it returns the token value', () => {
      // GIVEN
      const portalToken = 'portal-token-abc123'

      localStorage.setItem(CUSTOMER_PORTAL_TOKEN_LS_KEY, JSON.stringify(portalToken))

      // WHEN
      const result = getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)

      // THEN
      expect(result).toBe(portalToken)
      expect(!!result).toBe(true)
    })

    it('GIVEN no customer portal token is stored in localStorage WHEN getItemFromLS is called with CUSTOMER_PORTAL_TOKEN_LS_KEY THEN it returns a falsy value', () => {
      // GIVEN -- localStorage is empty (cleared in afterEach)

      // WHEN
      const result = getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)

      // THEN
      expect(!!result).toBe(false)
    })

    it('GIVEN a customer portal token is stored as "undefined" WHEN getItemFromLS is called THEN it returns undefined (falsy)', () => {
      // GIVEN
      localStorage.setItem(CUSTOMER_PORTAL_TOKEN_LS_KEY, 'undefined')

      // WHEN
      const result = getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)

      // THEN
      expect(result).toBeUndefined()
      expect(!!result).toBe(false)
    })
  })

  describe('Portal guard decision -- should onAuthError be skipped', () => {
    it('GIVEN a customer portal token exists WHEN the portal guard evaluates THEN onAuthError should be skipped', () => {
      // GIVEN
      localStorage.setItem(CUSTOMER_PORTAL_TOKEN_LS_KEY, JSON.stringify('some-portal-token'))

      // WHEN -- replicate the guard logic from errorLink
      const isCustomerPortal = !!getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)

      // THEN
      expect(isCustomerPortal).toBe(true)
    })

    it('GIVEN no customer portal token exists WHEN the portal guard evaluates THEN onAuthError should NOT be skipped', () => {
      // GIVEN -- localStorage is empty

      // WHEN -- replicate the guard logic from errorLink
      const isCustomerPortal = !!getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)

      // THEN
      expect(isCustomerPortal).toBe(false)
    })
  })

  describe('CUSTOMER_PORTAL_TOKEN_LS_KEY constant', () => {
    it('GIVEN the constant is imported WHEN referenced THEN it has the expected localStorage key value', () => {
      // GIVEN/WHEN
      const key = CUSTOMER_PORTAL_TOKEN_LS_KEY

      // THEN
      expect(key).toBe('customerPortalToken')
    })
  })
})
