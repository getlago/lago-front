import { renderHook } from '@testing-library/react'

import { currentOrganizationVar } from '~/core/apolloClient/reactiveVars'
import { useCurrentUser } from '~/hooks/useCurrentUser'

const mockUseParams = jest.fn()
const mockIsAuthenticated = jest.fn()
const mockRefetch = jest.fn()
const mockUseGetCurrentUserInfosQuery = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}))

jest.mock('~/hooks/auth/useIsAuthenticated', () => ({
  useIsAuthenticated: () => ({ isAuthenticated: mockIsAuthenticated() }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCurrentUserInfosQuery: (opts: unknown) => mockUseGetCurrentUserInfosQuery(opts),
}))

const buildUser = (slugs: string[]) => ({
  id: 'user-1',
  email: 'a@b.c',
  premium: false,
  memberships: slugs.map((slug, i) => ({
    id: `m-${i}`,
    roles: [],
    organization: {
      id: `org-${slug}`,
      slug,
      name: slug,
      logoUrl: null,
      accessibleByCurrentSession: true,
    },
  })),
})

describe('useCurrentUser — stale-cache refetch safety net', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated.mockReturnValue(true)
    mockUseParams.mockReturnValue({})
    currentOrganizationVar(null)
    mockUseGetCurrentUserInfosQuery.mockReturnValue({
      data: undefined,
      loading: false,
      refetch: mockRefetch,
    })
  })

  afterEach(() => {
    currentOrganizationVar(null)
  })

  // Regression for the t30-multi-org-redirect E2E failure: on a hard reload the
  // persisted (cross-tab) Apollo cache can serve a complete-but-non-matching
  // `currentUser`, and with the org var no longer LS-seeded nothing re-fetched
  // it, so `OrganizationLayout` rendered Error404.
  it('refetches when the URL slug has no matching membership and the org var is null', () => {
    mockUseParams.mockReturnValue({ organizationSlug: 'org-a' })
    mockUseGetCurrentUserInfosQuery.mockReturnValue({
      data: { currentUser: buildUser(['org-b']) }, // stale: user is not a member of org-a
      loading: false,
      refetch: mockRefetch,
    })

    renderHook(() => useCurrentUser())

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('does NOT refetch when the URL slug matches a membership', () => {
    mockUseParams.mockReturnValue({ organizationSlug: 'org-a' })
    mockUseGetCurrentUserInfosQuery.mockReturnValue({
      data: { currentUser: buildUser(['org-a', 'org-b']) },
      loading: false,
      refetch: mockRefetch,
    })

    renderHook(() => useCurrentUser())

    expect(mockRefetch).not.toHaveBeenCalled()
  })

  it('does NOT refetch on a slug-less route when the org var is also null', () => {
    mockUseParams.mockReturnValue({}) // e.g. /login, customer portal
    mockUseGetCurrentUserInfosQuery.mockReturnValue({
      data: { currentUser: buildUser(['org-a']) },
      loading: false,
      refetch: mockRefetch,
    })

    renderHook(() => useCurrentUser())

    expect(mockRefetch).not.toHaveBeenCalled()
  })

  // Regression for the admin-panel "list jumps to top on every toggle" bug: slug-less routes
  // (admin panel, customer portal) must NOT refetch off the org var. There is no slug to
  // reconcile, and because MainNavLayout unmounts the route subtree during the refetch, the
  // remount re-runs this hook and refetches again — an infinite loop that resets scroll and
  // wipes in-progress local state on every render.
  it('does NOT refetch on a slug-less route even when the org var has no matching membership', () => {
    mockUseParams.mockReturnValue({})
    currentOrganizationVar('org-x') // var set, but no membership matches it
    mockUseGetCurrentUserInfosQuery.mockReturnValue({
      data: { currentUser: buildUser(['org-a']) },
      loading: false,
      refetch: mockRefetch,
    })

    renderHook(() => useCurrentUser())

    expect(mockRefetch).not.toHaveBeenCalled()
  })
})
