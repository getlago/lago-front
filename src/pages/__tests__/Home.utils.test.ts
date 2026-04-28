import { resolveRedirectTarget } from '../Home.utils'

jest.mock('~/core/router/utils/permissionRouteMap', () => ({
  getRouteForPermission: (permission: string | null) => {
    if (permission === 'plansView') return '/plans'
    if (permission === 'auditLogsView') return null

    return null
  },
}))

jest.mock('~/core/router/legacyPaths', () => ({
  LEGACY_APP_PATH_SEGMENTS: new Set(['customers', 'plans', 'features']),
}))

// `resolveOrgSlug` reads the reactive var; mock it via the underlying util.
jest.mock('~/core/apolloClient/reactiveVars', () => ({
  ...jest.requireActual('~/core/apolloClient/reactiveVars'),
  getCurrentOrganizationId: jest.fn(),
}))

const { getCurrentOrganizationId } = jest.requireMock('~/core/apolloClient/reactiveVars')

const SLUG = 'acme'
const ORG_ID = 'org-acme'

const mockHasPermissions = jest.fn()
const mockFindFirstViewPermission = jest.fn()

const buildUser = (memberships = [{ organization: { id: ORG_ID, slug: SLUG } }]) =>
  ({ memberships }) as unknown as Parameters<typeof resolveRedirectTarget>[0]['currentUser']

const baseInput = (overrides: Partial<Parameters<typeof resolveRedirectTarget>[0]> = {}) => ({
  currentUser: buildUser(),
  ssoRedirectPath: undefined,
  savedLocation: undefined,
  hasPermissions: mockHasPermissions,
  findFirstViewPermission: mockFindFirstViewPermission,
  hasAccessToAnalyticsDashboardsFeature: false,
  ...overrides,
})

describe('resolveRedirectTarget()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getCurrentOrganizationId.mockReturnValue(ORG_ID)
    mockHasPermissions.mockReturnValue(false)
    mockFindFirstViewPermission.mockReturnValue(null)
  })

  describe('GIVEN the user has no resolvable slug', () => {
    it('THEN returns FORBIDDEN_ROUTE without consuming LS', () => {
      const result = resolveRedirectTarget(baseInput({ currentUser: undefined }))

      expect(result).toEqual({ to: '/forbidden', consumesSsoLs: false })
    })
  })

  describe('GIVEN ssoRedirectPath is present', () => {
    it('THEN returns the path as-is when it already contains a valid user slug', () => {
      const result = resolveRedirectTarget(baseInput({ ssoRedirectPath: `/${SLUG}/features` }))

      expect(result).toEqual({ to: `/${SLUG}/features`, consumesSsoLs: true })
    })

    it('THEN prepends the slug for legacy slug-less paths', () => {
      const result = resolveRedirectTarget(baseInput({ ssoRedirectPath: '/features' }))

      expect(result).toEqual({ to: `/${SLUG}/features`, consumesSsoLs: true })
    })

    it('THEN takes priority over savedLocation from router state', () => {
      const result = resolveRedirectTarget(
        baseInput({
          ssoRedirectPath: `/${SLUG}/features`,
          savedLocation: { pathname: `/${SLUG}/customers` },
        }),
      )

      expect(result).toEqual({ to: `/${SLUG}/features`, consumesSsoLs: true })
    })
  })

  describe('GIVEN savedLocation has a slug belonging to the current user', () => {
    it('THEN returns it as a Location object (preserves any extra fields)', () => {
      const savedLocation = { pathname: `/${SLUG}/customers`, search: '?tab=overview', hash: '' }
      const result = resolveRedirectTarget(baseInput({ savedLocation }))

      expect(result).toEqual({ to: savedLocation, consumesSsoLs: false })
    })
  })

  describe('GIVEN savedLocation has a slug NOT belonging to the user (multi-org leak)', () => {
    it('THEN does NOT use it and falls through to default navigation', () => {
      mockHasPermissions.mockReturnValueOnce(true) // analytics
      const result = resolveRedirectTarget(
        baseInput({ savedLocation: { pathname: '/other-org/features' } }),
      )

      expect(result).toEqual({ to: `/${SLUG}/analytics`, consumesSsoLs: false })
    })
  })

  describe('GIVEN savedLocation is a legacy slug-less path AND the user has a single membership', () => {
    it('THEN prepends the slug and preserves search + hash', () => {
      const result = resolveRedirectTarget(
        baseInput({
          savedLocation: { pathname: '/customers/123', search: '?tab=foo', hash: '#section' },
        }),
      )

      expect(result).toEqual({
        to: `/${SLUG}/customers/123?tab=foo#section`,
        consumesSsoLs: false,
      })
    })
  })

  describe('GIVEN savedLocation is a legacy path AND the user has multiple memberships', () => {
    it('THEN does NOT auto-prepend (ambiguous) and falls through to default', () => {
      mockHasPermissions.mockReturnValueOnce(true) // analytics
      const result = resolveRedirectTarget(
        baseInput({
          currentUser: buildUser([
            { organization: { id: ORG_ID, slug: SLUG } },
            { organization: { id: 'org-b', slug: 'beta' } },
          ]),
          savedLocation: { pathname: '/customers/123' },
        }),
      )

      expect(result).toEqual({ to: `/${SLUG}/analytics`, consumesSsoLs: false })
    })
  })

  describe('GIVEN no SSO and no savedLocation — default navigation', () => {
    it('THEN returns analytics when user has analytics perms and no dashboard feature', () => {
      mockHasPermissions.mockReturnValueOnce(true)
      const result = resolveRedirectTarget(baseInput())

      expect(result).toEqual({ to: `/${SLUG}/analytics`, consumesSsoLs: false })
    })

    it('THEN returns analytics tabs route when user has both analytics perms AND dashboard feature', () => {
      mockHasPermissions.mockReturnValueOnce(true)
      const result = resolveRedirectTarget(
        baseInput({ hasAccessToAnalyticsDashboardsFeature: true }),
      )

      expect(result).toEqual({
        to: `/${SLUG}/analytics/revenue-streams`,
        consumesSsoLs: false,
      })
    })

    it('THEN returns customers when user lacks analytics but has customersView', () => {
      mockHasPermissions
        .mockReturnValueOnce(false) // analytics check
        .mockReturnValueOnce(true) // customers check
      const result = resolveRedirectTarget(baseInput())

      expect(result).toEqual({ to: `/${SLUG}/customers`, consumesSsoLs: false })
    })

    it('THEN returns first-view-permission route when no analytics nor customers', () => {
      mockHasPermissions.mockReturnValue(false)
      mockFindFirstViewPermission.mockReturnValue('plansView')
      const result = resolveRedirectTarget(baseInput())

      expect(result).toEqual({ to: `/${SLUG}/plans`, consumesSsoLs: false })
    })

    it('THEN returns FORBIDDEN_ROUTE when no permission resolves to a route', () => {
      mockHasPermissions.mockReturnValue(false)
      mockFindFirstViewPermission.mockReturnValue('auditLogsView')
      const result = resolveRedirectTarget(baseInput())

      expect(result).toEqual({ to: '/forbidden', consumesSsoLs: false })
    })
  })
})
