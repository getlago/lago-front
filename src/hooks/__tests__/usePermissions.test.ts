import { renderHook } from '@testing-library/react'

import { usePermissions } from '~/hooks/usePermissions'
import { AllTheProviders } from '~/test-utils'

const mockUseCurrentUser = jest.fn()

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}))

const createMembershipWithPermissions = (permissions: Record<string, boolean>) => ({
  id: '2',
  organization: {
    id: '3',
    name: 'Organization',
    logoUrl: 'https://logo.com',
  },
  permissions,
})

function prepare() {
  const customWrapper = ({ children }: { children: React.ReactNode }) =>
    AllTheProviders({
      children,
    })

  const { result } = renderHook(() => usePermissions(), {
    wrapper: customWrapper,
  })

  return { result }
}

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hasPermissions', () => {
    it('returns false when currentMembership is undefined', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: undefined,
      })

      const { result } = prepare()

      expect(result.current.hasPermissions(['addonsCreate'])).toBe(false)
    })

    it('returns false when currentMembership is null', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: null,
      })

      const { result } = prepare()

      expect(result.current.hasPermissions(['addonsCreate'])).toBe(false)
    })

    it('returns true when a single permission is granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
        }),
      })

      const { result } = prepare()

      expect(result.current.hasPermissions(['addonsCreate'])).toBe(true)
    })

    it('returns false when a single permission is not granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: false,
        }),
      })

      const { result } = prepare()

      expect(result.current.hasPermissions(['addonsCreate'])).toBe(false)
    })

    it('returns true when all requested permissions are granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
          addonsDelete: true,
          addonsUpdate: true,
        }),
      })

      const { result } = prepare()

      expect(result.current.hasPermissions(['addonsCreate', 'addonsDelete', 'addonsUpdate'])).toBe(
        true,
      )
    })

    it('returns false when at least one requested permission is not granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
          addonsDelete: false,
          addonsUpdate: true,
        }),
      })

      const { result } = prepare()

      expect(result.current.hasPermissions(['addonsCreate', 'addonsDelete'])).toBe(false)
    })

    it('returns false when permission value is undefined', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
        }),
      })

      const { result } = prepare()

      // @ts-expect-error - testing undefined permission
      expect(result.current.hasPermissions(['addonsCreate', 'nonExistentPermission'])).toBe(false)
    })

    it('returns true when checking an empty array of permissions', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
        }),
      })

      const { result } = prepare()

      expect(result.current.hasPermissions([])).toBe(true)
    })
  })

  describe('findViewPermissions', () => {
    it('returns an empty list when currentMembership is undefined', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: undefined,
      })

      const { result } = prepare()

      expect(result.current.findViewPermissions()).toEqual([])
    })

    it('returns an empty list when currentMembership is null', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: null,
      })

      const { result } = prepare()

      expect(result.current.findViewPermissions()).toEqual([])
    })

    it('returns every granted view permission in membership order', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
          addonsView: true,
          analyticsView: true,
          billableMetricsView: false,
        }),
      })

      const { result } = prepare()

      expect(result.current.findViewPermissions()).toEqual(['addonsView', 'analyticsView'])
    })

    it('returns an empty list when no view permissions are granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
          addonsDelete: true,
          addonsView: false,
          analyticsView: false,
        }),
      })

      const { result } = prepare()

      expect(result.current.findViewPermissions()).toEqual([])
    })

    it('returns an empty list when there are no view permissions in the object', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
          addonsDelete: true,
          addonsUpdate: true,
        }),
      })

      const { result } = prepare()

      expect(result.current.findViewPermissions()).toEqual([])
    })

    it('handles case-insensitive view permission matching', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsVIEW: true, // uppercase VIEW
          analyticsview: true, // lowercase view
        }),
      })

      const { result } = prepare()

      expect(result.current.findViewPermissions()).toHaveLength(2)
    })
  })

  describe('hasPermissionsOr', () => {
    it('returns false when currentMembership is undefined', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: undefined,
      })

      const { result } = prepare()

      expect(result.current.hasPermissionsOr(['addonsCreate'])).toBe(false)
    })

    it('returns false when currentMembership is null', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: null,
      })

      const { result } = prepare()

      expect(result.current.hasPermissionsOr(['addonsCreate'])).toBe(false)
    })

    it('returns true when a single permission is granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
        }),
      })

      const { result } = prepare()

      expect(result.current.hasPermissionsOr(['addonsCreate'])).toBe(true)
    })

    it('returns false when a single permission is not granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: false,
        }),
      })

      const { result } = prepare()

      expect(result.current.hasPermissionsOr(['addonsCreate'])).toBe(false)
    })

    it('returns true when at least one permission is granted (OR logic)', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
          addonsDelete: false,
          addonsUpdate: false,
        }),
      })

      const { result } = prepare()

      expect(
        result.current.hasPermissionsOr(['addonsCreate', 'addonsDelete', 'addonsUpdate']),
      ).toBe(true)
    })

    it('returns false when no permissions are granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: false,
          addonsDelete: false,
          addonsUpdate: false,
        }),
      })

      const { result } = prepare()

      expect(
        result.current.hasPermissionsOr(['addonsCreate', 'addonsDelete', 'addonsUpdate']),
      ).toBe(false)
    })

    it('returns true when multiple permissions are granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
          addonsDelete: true,
          addonsUpdate: false,
        }),
      })

      const { result } = prepare()

      expect(result.current.hasPermissionsOr(['addonsCreate', 'addonsDelete'])).toBe(true)
    })

    it('returns false when permission value is undefined', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
        }),
      })

      const { result } = prepare()

      // @ts-expect-error - testing undefined permission
      expect(result.current.hasPermissionsOr(['nonExistentPermission'])).toBe(false)
    })

    it('returns false when checking an empty array of permissions', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: true,
        }),
      })

      const { result } = prepare()

      // OR logic with empty array should return false (nothing to check)
      expect(result.current.hasPermissionsOr([])).toBe(false)
    })

    it('returns true when the last permission in the list is granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: false,
          addonsDelete: false,
          addonsUpdate: true,
        }),
      })

      const { result } = prepare()

      expect(
        result.current.hasPermissionsOr(['addonsCreate', 'addonsDelete', 'addonsUpdate']),
      ).toBe(true)
    })

    it('returns true when the middle permission in the list is granted', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({
          addonsCreate: false,
          addonsDelete: true,
          addonsUpdate: false,
        }),
      })

      const { result } = prepare()

      expect(
        result.current.hasPermissionsOr(['addonsCreate', 'addonsDelete', 'addonsUpdate']),
      ).toBe(true)
    })
  })

  describe('returned functions', () => {
    it('returns hasPermissions function', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({}),
      })

      const { result } = prepare()

      expect(result.current.hasPermissions).toBeDefined()
      expect(typeof result.current.hasPermissions).toBe('function')
    })

    it('returns hasPermissionsOr function', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({}),
      })

      const { result } = prepare()

      expect(result.current.hasPermissionsOr).toBeDefined()
      expect(typeof result.current.hasPermissionsOr).toBe('function')
    })

    it('returns findViewPermissions function', () => {
      mockUseCurrentUser.mockReturnValue({
        currentMembership: createMembershipWithPermissions({}),
      })

      const { result } = prepare()

      expect(result.current.findViewPermissions).toBeDefined()
      expect(typeof result.current.findViewPermissions).toBe('function')
    })
  })
})
