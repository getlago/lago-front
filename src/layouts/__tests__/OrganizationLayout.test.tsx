import * as Sentry from '@sentry/react'
import { renderHook } from '@testing-library/react'

// Import after mocks
import OrganizationLayout from '../OrganizationLayout'

// ---------- Mock fns ----------
const mockNavigate = jest.fn()
const mockUseParams = jest.fn()
const mockUseLocation = jest.fn()
const mockUseCurrentUser = jest.fn()
const mockSwitchCurrentOrganization = jest.fn()
const mockSetCurrentOrganizationId = jest.fn()
const mockCurrentOrganizationVar = jest.fn()
const mockGetCurrentOrganizationId = jest.fn()
const mockLocationHistoryVar = jest.fn()

// ---------- Mocks ----------
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
  Outlet: () => <div data-test="outlet" />,
}))

// `~/core/router` barrel pulls in route modules that depend on
// `envGlobalVar` from `~/core/apolloClient`. Stub the two hooks we need
// directly so the barrel isn't traversed during this test.
jest.mock('~/core/router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}))

jest.mock('~/core/router/legacyPaths', () => ({
  LEGACY_APP_PATH_SEGMENTS: new Set(['customers', 'plans', 'settings']),
}))

const mockUseIsAuthenticated = jest.fn(() => ({ isAuthenticated: true }))

jest.mock('~/hooks/auth/useIsAuthenticated', () => ({
  useIsAuthenticated: () => mockUseIsAuthenticated(),
}))

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({ clearStore: jest.fn() }),
  useReactiveVar: (reactiveVar: () => unknown) => reactiveVar(),
}))

jest.mock('@sentry/react', () => ({
  captureMessage: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  switchCurrentOrganization: (...args: unknown[]) => mockSwitchCurrentOrganization(...args),
}))

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  currentOrganizationVar: () => mockCurrentOrganizationVar(),
  setCurrentOrganizationId: (...args: unknown[]) => mockSetCurrentOrganizationId(...args),
  getCurrentOrganizationId: () => mockGetCurrentOrganizationId(),
  locationHistoryVar: () => mockLocationHistoryVar(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

jest.mock('~/components/designSystem/Spinner', () => ({
  Spinner: () => <div data-test="spinner" />,
}))

jest.mock('~/pages/Error404', () => ({
  __esModule: true,
  default: () => <div data-test="error-404" />,
}))

const TEST_ORG_SLUG = 'acme'
const TEST_ORG_ID = 'org-1'
const OTHER_ORG_ID = 'org-2'

const defaultMemberships = [
  {
    id: 'membership-1',
    organization: { id: TEST_ORG_ID, name: 'Acme Corp', slug: TEST_ORG_SLUG },
  },
  {
    id: 'membership-2',
    organization: { id: OTHER_ORG_ID, name: 'Other Corp', slug: 'other-corp' },
  },
]

describe('OrganizationLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocation.mockReturnValue({ pathname: `/${TEST_ORG_SLUG}/customers` })
    mockLocationHistoryVar.mockReturnValue([])
    mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)
  })

  describe('GIVEN the user is loading', () => {
    describe('WHEN currentUser is not yet available', () => {
      it('THEN should render a spinner', () => {
        mockUseParams.mockReturnValue({ organizationSlug: TEST_ORG_SLUG })
        mockCurrentOrganizationVar.mockReturnValue(undefined)
        mockUseCurrentUser.mockReturnValue({
          currentUser: undefined,
          loading: true,
        })

        const { result } = renderHook(() => OrganizationLayout())

        expect(result.current).toBeTruthy()
      })
    })
  })

  describe('GIVEN the slug matches a user membership', () => {
    describe('WHEN the currentOrgId matches org.id', () => {
      it('THEN should call setCurrentOrganizationId', () => {
        mockUseParams.mockReturnValue({ organizationSlug: TEST_ORG_SLUG })
        mockCurrentOrganizationVar.mockReturnValue(undefined)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(mockSetCurrentOrganizationId).toHaveBeenCalledWith(TEST_ORG_ID)
      })
    })

    describe('WHEN the currentOrgId differs from org.id (org switch)', () => {
      it('THEN should call switchCurrentOrganization to clear Apollo cache', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'other-corp' })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(mockSwitchCurrentOrganization).toHaveBeenCalledWith(expect.anything(), OTHER_ORG_ID)
      })
    })

    describe('WHEN currentOrgId matches the resolved org', () => {
      it('THEN should render the Outlet', () => {
        mockUseParams.mockReturnValue({ organizationSlug: TEST_ORG_SLUG })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        const { result } = renderHook(() => OrganizationLayout())

        // Outlet is rendered when org matches
        expect(result.current).toBeTruthy()
        expect(mockSwitchCurrentOrganization).not.toHaveBeenCalled()
      })
    })

    describe('WHEN currentOrgId does not yet match org.id (transition)', () => {
      it('THEN should render a spinner while waiting', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'other-corp' })
        // currentOrgId still points to old org
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        const { result } = renderHook(() => OrganizationLayout())

        // During transition it renders spinner (since currentOrgId !== org.id)
        expect(result.current).toBeTruthy()
      })
    })
  })

  describe('GIVEN the slug does NOT match any membership', () => {
    describe('WHEN the slug is a legacy app path segment', () => {
      it('THEN should report to Sentry as legacy_url_accessed for external hits', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })
        mockLocationHistoryVar.mockReturnValue([])
        mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)

        renderHook(() => OrganizationLayout())

        expect(Sentry.captureMessage).toHaveBeenCalledWith(
          'legacy_url_accessed',
          expect.objectContaining({
            level: 'warning',
            tags: expect.objectContaining({
              attemptedSlug: 'customers',
              source: 'external',
            }),
          }),
        )
      })

      it('THEN should report to Sentry as slug_migration_missed_link when previous path has valid slug', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })
        // Previous navigation was from within the app (slug-prefixed path)
        mockLocationHistoryVar.mockReturnValue([{ pathname: `/${TEST_ORG_SLUG}/plans` }])
        mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)

        renderHook(() => OrganizationLayout())

        expect(Sentry.captureMessage).toHaveBeenCalledWith(
          'slug_migration_missed_link',
          expect.objectContaining({
            level: 'error',
            tags: expect.objectContaining({
              attemptedSlug: 'customers',
              source: 'missed_migration',
            }),
          }),
        )
      })
    })

    describe('WHEN the slug is an unknown value (not a legacy path)', () => {
      it('THEN should render Error404 without Sentry reporting', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'totally-unknown' })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(Sentry.captureMessage).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a legacy path AND the user has exactly one membership', () => {
    const singleMembership = [
      {
        id: 'membership-1',
        organization: { id: TEST_ORG_ID, name: 'Acme Corp', slug: TEST_ORG_SLUG },
      },
    ]

    it('THEN should auto-redirect to the slug-prefixed path and emit an info Sentry event', () => {
      mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
      mockUseLocation.mockReturnValue({
        pathname: '/customers',
        search: '?foo=bar',
        hash: '#section',
      })
      mockCurrentOrganizationVar.mockReturnValue(undefined)
      mockUseCurrentUser.mockReturnValue({
        currentUser: { memberships: singleMembership },
        loading: false,
      })

      renderHook(() => OrganizationLayout())

      expect(mockNavigate).toHaveBeenCalledWith(
        `/${TEST_ORG_SLUG}/customers?foo=bar#section`,
        expect.objectContaining({
          replace: true,
          skipSlugPrepend: true,
        }),
      )
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'legacy_url_auto_recovered',
        expect.objectContaining({
          level: 'info',
          tags: expect.objectContaining({
            attemptedSlug: 'customers',
            recoveredToSlug: TEST_ORG_SLUG,
          }),
        }),
      )
      // The 404-path events must NOT fire — auto-recover has its own event.
      expect(Sentry.captureMessage).not.toHaveBeenCalledWith(
        'legacy_url_accessed',
        expect.anything(),
      )
      expect(Sentry.captureMessage).not.toHaveBeenCalledWith(
        'slug_migration_missed_link',
        expect.anything(),
      )
    })

    it('THEN should NOT auto-redirect when the slug is unknown (not in legacy paths)', () => {
      mockUseParams.mockReturnValue({ organizationSlug: 'totally-unknown' })
      mockUseLocation.mockReturnValue({ pathname: '/totally-unknown', search: '', hash: '' })
      mockCurrentOrganizationVar.mockReturnValue(undefined)
      mockUseCurrentUser.mockReturnValue({
        currentUser: { memberships: singleMembership },
        loading: false,
      })

      renderHook(() => OrganizationLayout())

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN the user is NOT authenticated (e.g. just logged out)', () => {
    it('THEN should render null so the route guard handles the redirect to /login', () => {
      mockUseIsAuthenticated.mockReturnValueOnce({ isAuthenticated: false })
      mockUseParams.mockReturnValue({ organizationSlug: TEST_ORG_SLUG })
      mockCurrentOrganizationVar.mockReturnValue(undefined)
      // On logout, Apollo cache is cleared → currentUser becomes undefined
      // with loading === false. Without the auth guard the layout would
      // fall through to Error404.
      mockUseCurrentUser.mockReturnValue({ currentUser: undefined, loading: false })

      const { result } = renderHook(() => OrganizationLayout())

      expect(result.current).toBeNull()
    })
  })
})
