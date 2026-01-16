import { renderHook, waitFor } from '@testing-library/react'
import type { Location } from 'react-router-dom'

import { PremiumIntegrationTypeEnum } from '~/generated/graphql'

// Import Home component after all mocks are set up

import Home from '../Home'

const mockNavigate = jest.fn()
const mockUseLocation = jest.fn()
const mockGetItemFromLS = jest.fn()
const mockHasPermissions = jest.fn()
const mockFindFirstViewPermission = jest.fn()
const mockHasOrganizationPremiumAddon = jest.fn()
const mockGetRouteForPermission = jest.fn()
const mockUseCurrentUser = jest.fn()
const mockUseOrganizationInfos = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
  generatePath: jest.fn((route, params) => {
    return route.replace(':tab', params.tab)
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  getItemFromLS: (key: string) => mockGetItemFromLS(key),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => mockUseOrganizationInfos(),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
    findFirstViewPermission: mockFindFirstViewPermission,
  }),
}))

jest.mock('~/core/router/utils/permissionRouteMap', () => ({
  getRouteForPermission: (permission: string | null) => mockGetRouteForPermission(permission),
}))

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockGetItemFromLS.mockClear()
    mockHasPermissions.mockClear()
    mockFindFirstViewPermission.mockClear()
    mockHasOrganizationPremiumAddon.mockClear()
    mockGetRouteForPermission.mockClear()
    mockUseCurrentUser.mockClear()
    mockUseOrganizationInfos.mockClear()
    mockUseLocation.mockReturnValue({ state: null })

    // Default mock values for a logged-in user
    mockUseCurrentUser.mockReturnValue({
      loading: false,
      currentMembership: { id: 'membership-1' },
    })
    mockUseOrganizationInfos.mockReturnValue({
      loading: false,
      hasOrganizationPremiumAddon: mockHasOrganizationPremiumAddon,
    })
  })

  describe('redirect from login with saved location', () => {
    const savedLocation: Location = {
      pathname: '/customers/123',
      search: '?tab=overview',
      hash: '',
      state: null,
      key: 'saved-key',
    }

    it('should redirect to saved location when orgId matches', async () => {
      mockUseLocation.mockReturnValue({
        state: {
          from: savedLocation,
          orgId: 'org-a',
        },
      })
      mockGetItemFromLS.mockReturnValue('org-a')

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(savedLocation, { replace: true })
      })
    })

    it('should redirect to saved location when orgId is null (first login)', async () => {
      mockUseLocation.mockReturnValue({
        state: {
          from: savedLocation,
          orgId: null,
        },
      })
      mockGetItemFromLS.mockReturnValue('org-a')

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(savedLocation, { replace: true })
      })
    })

    it('should NOT redirect to saved location when orgId does not match', async () => {
      mockUseLocation.mockReturnValue({
        state: {
          from: savedLocation,
          orgId: 'org-a',
        },
      })
      mockGetItemFromLS.mockReturnValue('org-b')
      mockHasPermissions.mockImplementation((perms: string[]) => {
        return perms.includes('customersView')
      })
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      renderHook(() => Home())

      await waitFor(() => {
        // Should fall through to default navigation (customers list)
        expect(mockNavigate).toHaveBeenCalledWith('/customers', { replace: true })
        expect(mockNavigate).not.toHaveBeenCalledWith(savedLocation, { replace: true })
      })
    })

    it('should ignore saved location with root pathname', async () => {
      const rootLocation = { ...savedLocation, pathname: '/' }

      mockUseLocation.mockReturnValue({
        state: {
          from: rootLocation,
          orgId: 'org-a',
        },
      })
      mockGetItemFromLS.mockReturnValue('org-a')
      mockHasPermissions.mockImplementation((perms: string[]) => {
        return perms.includes('customersView')
      })
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      renderHook(() => Home())

      await waitFor(() => {
        // Should fall through to default navigation
        expect(mockNavigate).toHaveBeenCalledWith('/customers', { replace: true })
        expect(mockNavigate).not.toHaveBeenCalledWith(rootLocation, { replace: true })
      })
    })
  })

  describe('default navigation', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({ state: null })
    })

    it('should redirect to analytics when user has analyticsView and no dashboard feature', async () => {
      mockHasPermissions.mockReturnValue(true)
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/analytics', { replace: true })
      })
    })

    it('should redirect to analytics dashboards when user has dataApiView and dashboard feature', async () => {
      mockHasPermissions.mockImplementation((perms: string[]) => {
        return perms.includes('dataApiView')
      })
      mockHasOrganizationPremiumAddon.mockImplementation((addon: PremiumIntegrationTypeEnum) => {
        return addon === PremiumIntegrationTypeEnum.AnalyticsDashboards
      })

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/analytics/revenue-streams', { replace: true })
      })
    })

    it('should redirect to customers list when user has customersView but no analytics permissions', async () => {
      mockHasPermissions.mockImplementation((perms: string[]) => {
        return perms.includes('customersView')
      })
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customers', { replace: true })
      })
    })

    it('should use findFirstViewPermission when user has no customersView', async () => {
      mockHasPermissions.mockReturnValue(false)
      mockHasOrganizationPremiumAddon.mockReturnValue(false)
      mockFindFirstViewPermission.mockReturnValue('plansView')
      mockGetRouteForPermission.mockReturnValue('/plans')

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockFindFirstViewPermission).toHaveBeenCalled()
        expect(mockGetRouteForPermission).toHaveBeenCalledWith('plansView')
        expect(mockNavigate).toHaveBeenCalledWith('/plans', { replace: true })
      })
    })

    it('should redirect to forbidden route when no accessible routes exist', async () => {
      mockHasPermissions.mockReturnValue(false)
      mockHasOrganizationPremiumAddon.mockReturnValue(false)
      mockFindFirstViewPermission.mockReturnValue(null)
      mockGetRouteForPermission.mockReturnValue(null)

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/forbidden', { replace: true })
      })
    })

    it('should redirect to forbidden when permission has no associated route', async () => {
      mockHasPermissions.mockReturnValue(false)
      mockHasOrganizationPremiumAddon.mockReturnValue(false)
      mockFindFirstViewPermission.mockReturnValue('auditLogsView')
      mockGetRouteForPermission.mockReturnValue(null)

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockGetRouteForPermission).toHaveBeenCalledWith('auditLogsView')
        expect(mockNavigate).toHaveBeenCalledWith('/forbidden', { replace: true })
      })
    })
  })

  describe('loading states', () => {
    it('should not navigate when user is loading', async () => {
      mockUseCurrentUser.mockReturnValue({
        loading: true,
        currentMembership: null,
      })

      renderHook(() => Home())

      // Wait a bit to ensure no navigation happens
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not navigate when organization is loading', async () => {
      mockUseOrganizationInfos.mockReturnValue({
        loading: true,
        hasOrganizationPremiumAddon: mockHasOrganizationPremiumAddon,
      })

      renderHook(() => Home())

      // Wait a bit to ensure no navigation happens
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not navigate when currentMembership is null', async () => {
      mockUseCurrentUser.mockReturnValue({
        loading: false,
        currentMembership: null,
      })

      renderHook(() => Home())

      // Wait a bit to ensure no navigation happens
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should navigate only after all loading completes and membership exists', async () => {
      mockHasPermissions.mockImplementation((perms: string[]) => {
        return perms.includes('customersView')
      })
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      // Initially loading
      mockUseCurrentUser.mockReturnValue({
        loading: true,
        currentMembership: null,
      })

      const { rerender } = renderHook(() => Home())

      // Wait a bit to ensure no navigation happens during loading
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(mockNavigate).not.toHaveBeenCalled()

      // Now loaded
      mockUseCurrentUser.mockReturnValue({
        loading: false,
        currentMembership: { id: 'membership-1' },
      })

      rerender()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customers', { replace: true })
      })
    })
  })

  describe('permission priority', () => {
    it('should prioritize analyticsView over customersView when no dashboard feature', async () => {
      mockHasPermissions.mockImplementation((perms: string[]) => {
        // User has both analyticsView and customersView
        return perms.includes('analyticsView') || perms.includes('customersView')
      })
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/analytics', { replace: true })
      })
    })

    it('should prioritize dataApiView + dashboard feature over customersView', async () => {
      mockHasPermissions.mockImplementation((perms: string[]) => {
        // User has both dataApiView and customersView
        return perms.includes('dataApiView') || perms.includes('customersView')
      })
      mockHasOrganizationPremiumAddon.mockImplementation((addon: PremiumIntegrationTypeEnum) => {
        return addon === PremiumIntegrationTypeEnum.AnalyticsDashboards
      })

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/analytics/revenue-streams', { replace: true })
      })
    })

    it('should fall back to customersView when analyticsView exists but dashboard feature is enabled', async () => {
      // analyticsView without dashboard feature = analytics route
      // analyticsView with dashboard feature = need dataApiView, so fall through
      mockHasPermissions.mockImplementation((perms: string[]) => {
        return perms.includes('analyticsView') || perms.includes('customersView')
      })
      mockHasOrganizationPremiumAddon.mockImplementation((addon: PremiumIntegrationTypeEnum) => {
        return addon === PremiumIntegrationTypeEnum.AnalyticsDashboards
      })

      renderHook(() => Home())

      await waitFor(() => {
        // With dashboard feature, analyticsView check passes but condition requires !hasAccessToAnalyticsDashboardsFeature
        // So it falls through to check dataApiView (false), then customersView (true)
        expect(mockNavigate).toHaveBeenCalledWith('/customers', { replace: true })
      })
    })
  })
})
