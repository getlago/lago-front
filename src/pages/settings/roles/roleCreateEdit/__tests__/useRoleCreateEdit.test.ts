import { renderHook } from '@testing-library/react'

import { useRoleCreateEdit } from '../useRoleCreateEdit'

const mockUseParams = jest.fn()
const mockUseLocation = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
  generatePath: (path: string) => path,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  addToast: jest.fn(),
  envGlobalVar: () => ({ disableSignUp: false }),
}))

jest.mock('~/core/router', () => ({
  ROLE_DETAILS_ROUTE: '/settings/roles/:roleId',
}))

jest.mock('~/generated/graphql', () => ({
  useCreateRoleMutation: () => [jest.fn()],
  useEditRoleMutation: () => [jest.fn()],
}))

describe('useRoleCreateEdit', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({})
    mockUseLocation.mockReturnValue({ search: '' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('roleId detection', () => {
    it('returns undefined roleId when no params or query', () => {
      const { result } = renderHook(() => useRoleCreateEdit())

      expect(result.current.roleId).toBeUndefined()
    })

    it('returns roleId from URL params when editing', () => {
      mockUseParams.mockReturnValue({ roleId: 'edit-role-123' })

      const { result } = renderHook(() => useRoleCreateEdit())

      expect(result.current.roleId).toBe('edit-role-123')
    })

    it('returns roleId from query param when duplicating', () => {
      mockUseLocation.mockReturnValue({ search: '?duplicate-from=duplicate-role-456' })

      const { result } = renderHook(() => useRoleCreateEdit())

      expect(result.current.roleId).toBe('duplicate-role-456')
    })

    it('prioritizes URL param over query param', () => {
      mockUseParams.mockReturnValue({ roleId: 'edit-role-123' })
      mockUseLocation.mockReturnValue({ search: '?duplicate-from=duplicate-role-456' })

      const { result } = renderHook(() => useRoleCreateEdit())

      expect(result.current.roleId).toBe('edit-role-123')
    })
  })

  describe('isEdition flag', () => {
    it('returns false when creating new role', () => {
      const { result } = renderHook(() => useRoleCreateEdit())

      expect(result.current.isEdition).toBe(false)
    })

    it('returns true when editing existing role', () => {
      mockUseParams.mockReturnValue({ roleId: 'edit-role-123' })

      const { result } = renderHook(() => useRoleCreateEdit())

      expect(result.current.isEdition).toBe(true)
    })

    it('returns false when duplicating a role', () => {
      mockUseLocation.mockReturnValue({ search: '?duplicate-from=duplicate-role-456' })

      const { result } = renderHook(() => useRoleCreateEdit())

      expect(result.current.isEdition).toBe(false)
    })
  })
})
