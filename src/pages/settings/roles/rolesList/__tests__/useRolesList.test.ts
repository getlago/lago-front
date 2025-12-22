import { act, renderHook, waitFor } from '@testing-library/react'

import { addToast } from '~/core/apolloClient/reactiveVars/toastVar'

import { allRoles } from '../mock/allRoles'
import { useRolesList } from '../useRolesList'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/core/apolloClient/reactiveVars/toastVar', () => ({
  addToast: jest.fn(),
}))

describe('useRolesList', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useRolesList())

    expect(result.current.isLoadingRoles).toBe(true)
    expect(result.current.roles).toEqual([])
  })

  it('returns roles after loading', async () => {
    const { result } = renderHook(() => useRolesList())

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isLoadingRoles).toBe(false)
    })

    expect(result.current.roles).toEqual(allRoles)
  })

  it('returns all three system roles', async () => {
    const { result } = renderHook(() => useRolesList())

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isLoadingRoles).toBe(false)
    })

    const roleNames = result.current.roles.map((r) => r.name)

    expect(roleNames).toContain('admin')
    expect(roleNames).toContain('manager')
    expect(roleNames).toContain('finance')
  })

  describe('deleteRole', () => {
    it('shows success toast when deleting a role', async () => {
      const { result } = renderHook(() => useRolesList())

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(result.current.isLoadingRoles).toBe(false)
      })

      const deletedRoleId = result.current.deleteRole('1')

      expect(addToast).toHaveBeenCalledWith({
        message: 'text_1766158947598m8ut1nw2vjq',
        severity: 'success',
      })
      expect(deletedRoleId).toBe('1')
    })

    it('returns the deleted role ID', async () => {
      const { result } = renderHook(() => useRolesList())

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(result.current.isLoadingRoles).toBe(false)
      })

      expect(result.current.deleteRole('test-id')).toBe('test-id')
    })
  })
})
