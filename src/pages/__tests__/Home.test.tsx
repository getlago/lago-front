import { renderHook, waitFor } from '@testing-library/react'
import type { Location } from 'react-router-dom'

import { PremiumIntegrationTypeEnum } from '~/generated/graphql'

// Import Home component after all mocks are set up

import Home from '../Home'

const mockNavigate = jest.fn()
const mockUseLocation = jest.fn()
const mockGetItemFromLS = jest.fn()
const mockHasPermissions = jest.fn()
const mockHasOrganizationPremiumAddon = jest.fn()

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
  useCurrentUser: () => ({
    loading: false,
    currentMembership: { id: 'membership-1' },
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    loading: false,
    hasOrganizationPremiumAddon: mockHasOrganizationPremiumAddon,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockGetItemFromLS.mockClear()
    mockHasPermissions.mockClear()
    mockHasOrganizationPremiumAddon.mockClear()
    mockUseLocation.mockReturnValue({ state: null })
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
      mockHasPermissions.mockReturnValue(false)
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
      mockHasPermissions.mockReturnValue(false)
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

    it('should redirect to customers list when user has no special permissions', async () => {
      mockHasPermissions.mockReturnValue(false)
      mockHasOrganizationPremiumAddon.mockReturnValue(false)

      renderHook(() => Home())

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customers', { replace: true })
      })
    })
  })
})
