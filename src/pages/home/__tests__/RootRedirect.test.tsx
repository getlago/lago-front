import { renderHook } from '@testing-library/react'

import type { envGlobalVar } from '~/core/apolloClient/reactiveVars/envGlobalVar'
import { CREATE_ORGANIZATION_ROUTE } from '~/core/router/paths/createOrganization'

import RootRedirect from '../RootRedirect'

type SelfServeFlag = Pick<ReturnType<typeof envGlobalVar>, 'selfServeEnabled'>

const mockNavigate = jest.fn()
const mockUseLocation = jest.fn()
const mockUseCurrentUser = jest.fn()
const mockGetItemFromLS = jest.fn()
const mockGetPersistedOrganizationSlug = jest.fn()
const mockEnvGlobalVar = jest.fn<SelfServeFlag, []>()

// Stub the `~/core/router` barrel so the route modules (which pull in
// `envGlobalVar`) aren't traversed during the test.
jest.mock('~/core/router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
  FORBIDDEN_ROUTE: '/forbidden',
}))

jest.mock('~/core/utils/localStorage', () => ({
  getItemFromLS: (key: string) => mockGetItemFromLS(key),
}))

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  envGlobalVar: () => mockEnvGlobalVar(),
  getPersistedOrganizationSlug: () => mockGetPersistedOrganizationSlug(),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

jest.mock('~/components/designSystem/Spinner', () => ({
  Spinner: () => null,
}))

const membership = (slug: string, accessibleByCurrentSession = true) => ({
  id: `membership-${slug}`,
  organization: { id: `id-${slug}`, slug, accessibleByCurrentSession },
})

describe('RootRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocation.mockReturnValue({ state: null })
    mockGetItemFromLS.mockReturnValue(null)
    mockGetPersistedOrganizationSlug.mockReturnValue(null)
    mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: false })
    mockUseCurrentUser.mockReturnValue({
      loading: false,
      currentUser: { memberships: [membership('acme'), membership('globex')] },
    })
  })

  it('does nothing while the user is still loading', () => {
    mockUseCurrentUser.mockReturnValue({ loading: true, currentUser: undefined })

    renderHook(() => RootRedirect())

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('falls back to the first accessible membership', () => {
    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith(
      '/acme',
      expect.objectContaining({ replace: true, skipSlugPrepend: true }),
    )
  })

  it('prefers the persisted last-used slug when it is an accessible membership', () => {
    mockGetPersistedOrganizationSlug.mockReturnValue('globex')

    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith('/globex', expect.objectContaining({ replace: true }))
  })

  it('prefers the saved `from` slug over the persisted/SSO slug', () => {
    mockUseLocation.mockReturnValue({ state: { from: { pathname: '/globex/customers/1' } } })
    mockGetPersistedOrganizationSlug.mockReturnValue('acme')

    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith('/globex', expect.objectContaining({ replace: true }))
  })

  it('uses the SSO redirect path slug when there is no saved `from`', () => {
    mockGetItemFromLS.mockReturnValue('/globex/analytics')

    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith('/globex', expect.objectContaining({ replace: true }))
  })

  it.each(['/globex', '/globex?tab=1', '/globex#top'])(
    'reads the whole first segment of the SSO redirect path %s',
    (ssoPath) => {
      mockGetItemFromLS.mockReturnValue(ssoPath)

      renderHook(() => RootRedirect())

      expect(mockNavigate).toHaveBeenCalledWith(
        '/globex',
        expect.objectContaining({ replace: true }),
      )
    },
  )

  it('reads the whole first segment of the saved `from` path', () => {
    mockUseLocation.mockReturnValue({ state: { from: { pathname: '/globex?tab=1' } } })

    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith('/globex', expect.objectContaining({ replace: true }))
  })

  it('ignores a persisted slug that is not an accessible membership', () => {
    mockGetPersistedOrganizationSlug.mockReturnValue('not-a-member')

    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith('/acme', expect.objectContaining({ replace: true }))
  })

  it('ignores memberships that are not accessible by the current session', () => {
    mockUseCurrentUser.mockReturnValue({
      loading: false,
      currentUser: { memberships: [membership('locked', false), membership('open')] },
    })

    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith('/open', expect.objectContaining({ replace: true }))
  })

  it('redirects to FORBIDDEN when there is no accessible membership', () => {
    mockUseCurrentUser.mockReturnValue({
      loading: false,
      currentUser: { memberships: [membership('locked', false)] },
    })

    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith('/forbidden', { replace: true })
  })

  it('forwards location.state on the bounce (so the saved `from` survives)', () => {
    const state = { from: { pathname: '/acme/customers/1' } }

    mockUseLocation.mockReturnValue({ state })

    renderHook(() => RootRedirect())

    expect(mockNavigate).toHaveBeenCalledWith(
      '/acme',
      expect.objectContaining({ state, replace: true }),
    )
  })

  describe('GIVEN a self-serve user who needs an organization', () => {
    beforeEach(() => {
      mockUseCurrentUser.mockReturnValue({
        loading: false,
        currentUser: { needsOrganization: true, memberships: [] },
      })
    })

    describe('WHEN the self-serve flag is on', () => {
      beforeEach(() => {
        mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: true })
      })

      it('THEN should redirect to the create organization page instead of forbidden', () => {
        renderHook(() => RootRedirect())

        expect(mockNavigate).toHaveBeenCalledWith(CREATE_ORGANIZATION_ROUTE, { replace: true })
        expect(mockNavigate).not.toHaveBeenCalledWith('/forbidden', expect.anything())
      })

      it('THEN should redirect only once when the user is re-delivered', () => {
        const { rerender } = renderHook(() => RootRedirect())

        mockUseCurrentUser.mockReturnValue({
          loading: false,
          currentUser: { needsOrganization: true, memberships: [] },
        })
        rerender()

        expect(mockNavigate).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the self-serve flag is off', () => {
      it('THEN should redirect to forbidden as before', () => {
        renderHook(() => RootRedirect())

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/forbidden', { replace: true })
      })
    })
  })

  describe('GIVEN the self-serve flag is on and the user does not need an organization', () => {
    beforeEach(() => {
      mockEnvGlobalVar.mockReturnValue({ selfServeEnabled: true })
    })

    describe('WHEN the user has an accessible membership', () => {
      it('THEN should redirect to the organization slug', () => {
        mockUseCurrentUser.mockReturnValue({
          loading: false,
          currentUser: { needsOrganization: false, memberships: [membership('acme')] },
        })

        renderHook(() => RootRedirect())

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith(
          '/acme',
          expect.objectContaining({ replace: true, skipSlugPrepend: true }),
        )
      })
    })

    describe('WHEN no membership is accessible', () => {
      it('THEN should redirect to forbidden', () => {
        mockUseCurrentUser.mockReturnValue({
          loading: false,
          currentUser: { needsOrganization: false, memberships: [membership('locked', false)] },
        })

        renderHook(() => RootRedirect())

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/forbidden', { replace: true })
      })
    })
  })
})
