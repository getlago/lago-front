import * as Sentry from '@sentry/react'
import { render, renderHook, waitFor } from '@testing-library/react'

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
const mockGetPersistedOrganizationSlug = jest.fn()
const mockSetPersistedOrganizationSlug = jest.fn()
const mockLocationHistoryVar = jest.fn()

// ---------- Mocks ----------
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
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
  captureException: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  switchCurrentOrganization: (...args: unknown[]) => mockSwitchCurrentOrganization(...args),
}))

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  currentOrganizationVar: () => mockCurrentOrganizationVar(),
  setCurrentOrganizationId: (...args: unknown[]) => mockSetCurrentOrganizationId(...args),
  getCurrentOrganizationId: () => mockGetCurrentOrganizationId(),
  getPersistedOrganizationSlug: () => mockGetPersistedOrganizationSlug(),
  setPersistedOrganizationSlug: (...args: unknown[]) => mockSetPersistedOrganizationSlug(...args),
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

jest.mock('~/pages/Forbidden', () => ({
  __esModule: true,
  default: () => <div data-test="forbidden" />,
}))

const TEST_ORG_SLUG = 'acme'
const TEST_ORG_ID = 'org-1'
const OTHER_ORG_ID = 'org-2'

const defaultMemberships = [
  {
    id: 'membership-1',
    organization: {
      id: TEST_ORG_ID,
      name: 'Acme Corp',
      slug: TEST_ORG_SLUG,
      accessibleByCurrentSession: true,
    },
  },
  {
    id: 'membership-2',
    organization: {
      id: OTHER_ORG_ID,
      name: 'Other Corp',
      slug: 'other-corp',
      accessibleByCurrentSession: true,
    },
  },
]

describe('OrganizationLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocation.mockReturnValue({
      pathname: `/${TEST_ORG_SLUG}/customers`,
      search: '',
      hash: '',
    })
    mockLocationHistoryVar.mockReturnValue([])
    window.history.replaceState(null, '')
    mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)
    // Persisted last-used slug (read by the missed-migration detection).
    mockGetPersistedOrganizationSlug.mockReturnValue(TEST_ORG_SLUG)
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

  describe('GIVEN the slug matches a membership the current session cannot access', () => {
    const currentUserWithLockedOrg = {
      memberships: [
        defaultMemberships[0],
        {
          ...defaultMemberships[1],
          organization: {
            ...defaultMemberships[1].organization,
            accessibleByCurrentSession: false,
          },
        },
      ],
    }

    beforeEach(() => {
      mockUseParams.mockReturnValue({ organizationSlug: 'other-corp' })
      mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
      mockUseCurrentUser.mockReturnValue({ currentUser: currentUserWithLockedOrg, loading: false })
    })

    it('THEN should render the forbidden page', async () => {
      const { container } = render(<OrganizationLayout />)

      await waitFor(() => {
        expect(container.querySelector('[data-test="forbidden"]')).toBeInTheDocument()
      })
      expect(container.querySelector('[data-test="outlet"]')).not.toBeInTheDocument()
    })

    it('THEN should not switch to that organization', () => {
      renderHook(() => OrganizationLayout())

      expect(mockSwitchCurrentOrganization).not.toHaveBeenCalled()
      expect(mockSetCurrentOrganizationId).not.toHaveBeenCalled()
      expect(mockSetPersistedOrganizationSlug).not.toHaveBeenCalled()
    })

    it('THEN should not auto-recover nor emit the slug migration signal', () => {
      renderHook(() => OrganizationLayout())

      expect(mockNavigate).not.toHaveBeenCalled()
      expect(Sentry.captureException).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'SlugMigrationMissedLink' }),
        expect.anything(),
      )
    })

    describe('WHEN the user lands on it from outside the app (bookmark, shared link)', () => {
      it('THEN should report it as external even with a stale in-app location history', () => {
        mockLocationHistoryVar.mockReturnValue([{ pathname: `/${TEST_ORG_SLUG}/plans` }])

        renderHook(() => OrganizationLayout())

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'OrganizationInaccessible' }),
          expect.objectContaining({ tags: expect.objectContaining({ source: 'external' }) }),
        )
      })

      it('THEN should emit an external org_inaccessible_for_session warning once', () => {
        const { rerender } = renderHook(() => OrganizationLayout())

        rerender()

        expect(Sentry.captureException).toHaveBeenCalledTimes(1)
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'OrganizationInaccessible',
            message: 'org_inaccessible_for_session',
          }),
          expect.objectContaining({
            level: 'warning',
            tags: expect.objectContaining({ attemptedSlug: 'other-corp', source: 'external' }),
            extra: expect.objectContaining({ accessibleMembershipsCount: 1 }),
          }),
        )
      })
    })

    describe('WHEN the user was already navigating inside the app', () => {
      it('THEN should emit an in_app org_inaccessible_for_session warning', () => {
        window.history.replaceState({ idx: 2 }, '')
        mockLocationHistoryVar.mockReturnValue([{ pathname: `/${TEST_ORG_SLUG}/plans` }])

        renderHook(() => OrganizationLayout())

        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'OrganizationInaccessible' }),
          expect.objectContaining({
            tags: expect.objectContaining({ source: 'in_app' }),
            extra: expect.objectContaining({ previousPath: `/${TEST_ORG_SLUG}/plans` }),
          }),
        )
      })
    })

    describe('WHEN the current user is refetched while the forbidden page is shown', () => {
      it('THEN should not report the same visit again', () => {
        const { rerender } = renderHook(() => OrganizationLayout())

        mockUseCurrentUser.mockReturnValue({ currentUser: currentUserWithLockedOrg, loading: true })
        rerender()
        mockUseCurrentUser.mockReturnValue({
          currentUser: currentUserWithLockedOrg,
          loading: false,
        })
        rerender()

        expect(Sentry.captureException).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the user leaves and comes back to the same organization', () => {
      it('THEN should report the new visit', () => {
        mockUseLocation.mockReturnValue({ pathname: '/other-corp', search: '', hash: '', key: 'a' })
        const { rerender } = renderHook(() => OrganizationLayout())

        mockUseLocation.mockReturnValue({ pathname: '/other-corp', search: '', hash: '', key: 'b' })
        rerender()

        expect(Sentry.captureException).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('GIVEN the slug matches an accessible membership', () => {
    it('THEN should not emit the org_inaccessible_for_session warning', () => {
      mockUseParams.mockReturnValue({ organizationSlug: TEST_ORG_SLUG })
      mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
      mockUseCurrentUser.mockReturnValue({
        currentUser: { memberships: defaultMemberships },
        loading: false,
      })

      renderHook(() => OrganizationLayout())

      expect(Sentry.captureException).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a legacy path AND some memberships the session cannot access', () => {
    const lockOrganization = (membership: (typeof defaultMemberships)[number]) => ({
      ...membership,
      organization: { ...membership.organization, accessibleByCurrentSession: false },
    })

    beforeEach(() => {
      mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
      mockUseLocation.mockReturnValue({ pathname: '/customers', search: '', hash: '' })
      mockCurrentOrganizationVar.mockReturnValue(undefined)
      mockGetCurrentOrganizationId.mockReturnValue(undefined)
    })

    describe('WHEN the persisted last-used org is not accessible', () => {
      it('THEN should recover into the accessible organization', () => {
        mockGetPersistedOrganizationSlug.mockReturnValue(TEST_ORG_SLUG)
        mockUseCurrentUser.mockReturnValue({
          currentUser: {
            memberships: [lockOrganization(defaultMemberships[0]), defaultMemberships[1]],
          },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(mockNavigate).toHaveBeenCalledWith(
          '/other-corp/customers',
          expect.objectContaining({ replace: true, skipSlugPrepend: true }),
        )
      })
    })

    describe('WHEN no membership is accessible', () => {
      beforeEach(() => {
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships.map(lockOrganization) },
          loading: false,
        })
      })

      it('THEN should render the forbidden page without navigating', async () => {
        const { container } = render(<OrganizationLayout />)

        await waitFor(() => {
          expect(container.querySelector('[data-test="forbidden"]')).toBeInTheDocument()
        })
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      it('THEN should emit the no_org_accessible_for_session warning', () => {
        renderHook(() => OrganizationLayout())

        expect(Sentry.captureException).toHaveBeenCalledTimes(1)
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'NoOrganizationAccessible',
            message: 'no_org_accessible_for_session',
          }),
          expect.objectContaining({
            level: 'warning',
            tags: expect.objectContaining({ attemptedSlug: 'customers', source: 'external' }),
            extra: expect.objectContaining({ accessibleMembershipsCount: 0 }),
          }),
        )
      })
    })
  })

  describe('GIVEN the slug does NOT match any membership', () => {
    describe('WHEN the slug is a legacy app path segment AND previous in-app path was slug-prefixed', () => {
      it('THEN should auto-recover AND emit slug_migration_missed_link error', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
        mockUseLocation.mockReturnValue({
          pathname: '/customers',
          search: '',
          hash: '',
        })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })
        // Previous navigation was from within the app (slug-prefixed path) →
        // signals an in-app non-migrated link (a real bug worth alerting on).
        mockLocationHistoryVar.mockReturnValue([{ pathname: `/${TEST_ORG_SLUG}/plans` }])
        mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)

        renderHook(() => OrganizationLayout())

        // The user-facing flow: auto-recover, no Error404.
        expect(mockNavigate).toHaveBeenCalledWith(
          `/${TEST_ORG_SLUG}/customers`,
          expect.objectContaining({ replace: true, skipSlugPrepend: true }),
        )

        // Missed-link (error) — the developer-actionable bug signal.
        // Auto-recovery silences the user-facing 404 but the error stays
        // visible in Sentry so non-migrated in-app links remain surfaced.
        expect(Sentry.captureException).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'SlugMigrationMissedLink',
            message: 'slug_migration_missed_link',
          }),
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

        expect(Sentry.captureException).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a legacy path AND the user has exactly one membership', () => {
    const singleMembership = [
      {
        id: 'membership-1',
        organization: {
          id: TEST_ORG_ID,
          name: 'Acme Corp',
          slug: TEST_ORG_SLUG,
          accessibleByCurrentSession: true,
        },
      },
    ]

    it('THEN should auto-redirect to the slug-prefixed path', () => {
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
      // No missed-link error when there is no previous in-app path — the user
      // arrived directly on the legacy URL (bookmark, external link).
      expect(Sentry.captureException).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'SlugMigrationMissedLink' }),
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

  describe('GIVEN a legacy path AND the user has multiple memberships', () => {
    describe('WHEN the URL has the Hubspot iframe param ?ifrm=true', () => {
      it('THEN should auto-redirect using the LS-based slug', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
        mockUseLocation.mockReturnValue({
          pathname: '/customers',
          search: '?ifrm=true',
          hash: '',
        })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        // resolveOrgSlug() reads getCurrentOrganizationId() under the hood
        mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(mockNavigate).toHaveBeenCalledWith(
          `/${TEST_ORG_SLUG}/customers?ifrm=true`,
          expect.objectContaining({
            replace: true,
            skipSlugPrepend: true,
          }),
        )
      })
    })

    describe('WHEN the URL has the Salesforce iframe param ?sfdc=true', () => {
      it('THEN should auto-redirect using the LS-based slug', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
        mockUseLocation.mockReturnValue({
          pathname: '/customers',
          search: '?sfdc=true',
          hash: '',
        })
        mockCurrentOrganizationVar.mockReturnValue(OTHER_ORG_ID)
        mockGetCurrentOrganizationId.mockReturnValue(OTHER_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(mockNavigate).toHaveBeenCalledWith(
          `/other-corp/customers?sfdc=true`,
          expect.objectContaining({
            replace: true,
            skipSlugPrepend: true,
          }),
        )
      })
    })

    describe('WHEN the URL has NO iframe param', () => {
      it('THEN should auto-redirect using resolveOrgSlug', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
        mockUseLocation.mockReturnValue({
          pathname: '/customers',
          search: '',
          hash: '',
        })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(mockNavigate).toHaveBeenCalledWith(
          `/${TEST_ORG_SLUG}/customers`,
          expect.objectContaining({ replace: true, skipSlugPrepend: true }),
        )
      })
    })

    describe('WHEN the URL has an iframe param but the slug is NOT a legacy path', () => {
      it('THEN should NOT auto-redirect (genuinely unknown slug → 404 stays explicit)', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'totally-unknown' })
        mockUseLocation.mockReturnValue({
          pathname: '/totally-unknown',
          search: '?ifrm=true',
          hash: '',
        })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the URL has an iframe param value other than "true"', () => {
      it('THEN should still auto-redirect (recovery is universal)', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
        mockUseLocation.mockReturnValue({
          pathname: '/customers',
          search: '?ifrm=false',
          hash: '',
        })
        mockCurrentOrganizationVar.mockReturnValue(TEST_ORG_ID)
        mockGetCurrentOrganizationId.mockReturnValue(TEST_ORG_ID)
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        expect(mockNavigate).toHaveBeenCalledWith(
          `/${TEST_ORG_SLUG}/customers?ifrm=false`,
          expect.objectContaining({ replace: true, skipSlugPrepend: true }),
        )
      })
    })

    describe('WHEN LS holds an org id that does NOT match any of the user memberships', () => {
      it('THEN should fall back to the first membership slug (resolveOrgSlug fallback)', () => {
        mockUseParams.mockReturnValue({ organizationSlug: 'customers' })
        mockUseLocation.mockReturnValue({
          pathname: '/customers',
          search: '?ifrm=true',
          hash: '',
        })
        mockCurrentOrganizationVar.mockReturnValue('stale-org-id-not-in-memberships')
        mockGetCurrentOrganizationId.mockReturnValue('stale-org-id-not-in-memberships')
        mockUseCurrentUser.mockReturnValue({
          currentUser: { memberships: defaultMemberships },
          loading: false,
        })

        renderHook(() => OrganizationLayout())

        // resolveOrgSlug fallback: first membership's slug
        expect(mockNavigate).toHaveBeenCalledWith(
          `/${TEST_ORG_SLUG}/customers?ifrm=true`,
          expect.objectContaining({ replace: true, skipSlugPrepend: true }),
        )
      })
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
