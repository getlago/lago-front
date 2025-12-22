import { act, renderHook, waitFor } from '@testing-library/react'

import { allRoles } from '../../rolesList/mock/allRoles'
import { useRoleDetails } from '../useRoleDetails'

describe('useRoleDetails', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useRoleDetails({ roleId: '1' }))

    expect(result.current.isLoadingRole).toBe(true)
    expect(result.current.role).toBeUndefined()
  })

  it('returns role data after loading', async () => {
    const { result } = renderHook(() => useRoleDetails({ roleId: '1' }))

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isLoadingRole).toBe(false)
    })

    expect(result.current.role).toEqual(allRoles[0])
  })

  it('returns undefined role when roleId does not exist', async () => {
    const { result } = renderHook(() => useRoleDetails({ roleId: 'nonexistent' }))

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isLoadingRole).toBe(false)
    })

    expect(result.current.role).toBeUndefined()
  })

  it('returns undefined role when roleId is undefined', async () => {
    const { result } = renderHook(() => useRoleDetails({ roleId: undefined }))

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() => {
      expect(result.current.isLoadingRole).toBe(false)
    })

    expect(result.current.role).toBeUndefined()
  })

  describe('system roles permissions', () => {
    it('does not allow editing or deleting admin role', async () => {
      const { result } = renderHook(() => useRoleDetails({ roleId: '1' }))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(result.current.isLoadingRole).toBe(false)
      })

      expect(result.current.role?.name).toBe('admin')
      expect(result.current.canBeEdited).toBe(false)
      expect(result.current.canBeDeleted).toBe(false)
    })

    it('does not allow editing or deleting manager role', async () => {
      const { result } = renderHook(() => useRoleDetails({ roleId: '2' }))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(result.current.isLoadingRole).toBe(false)
      })

      expect(result.current.role?.name).toBe('manager')
      expect(result.current.canBeEdited).toBe(false)
      expect(result.current.canBeDeleted).toBe(false)
    })

    it('does not allow editing or deleting finance role', async () => {
      const { result } = renderHook(() => useRoleDetails({ roleId: '3' }))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(result.current.isLoadingRole).toBe(false)
      })

      expect(result.current.role?.name).toBe('finance')
      expect(result.current.canBeEdited).toBe(false)
      expect(result.current.canBeDeleted).toBe(false)
    })
  })

  describe('custom roles permissions', () => {
    const customRoleWithoutMembers = {
      id: '100',
      organization: null,
      name: 'custom-role',
      description: 'A custom role',
      admin: false,
      deletedAt: null,
      members: [],
      permissions: ['plansView' as const],
    }

    const customRoleWithMembers = {
      id: '101',
      organization: null,
      name: 'custom-role-with-members',
      description: 'A custom role with members',
      admin: false,
      deletedAt: null,
      members: [{ id: '1', name: 'Test User', email: 'test@example.com' }],
      permissions: ['plansView' as const],
    }

    beforeEach(() => {
      allRoles.push(customRoleWithoutMembers)
      allRoles.push(customRoleWithMembers)
    })

    afterEach(() => {
      allRoles.pop()
      allRoles.pop()
    })

    it('allows editing and deleting custom role without members', async () => {
      const { result } = renderHook(() => useRoleDetails({ roleId: '100' }))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(result.current.isLoadingRole).toBe(false)
      })

      expect(result.current.role?.name).toBe('custom-role')
      expect(result.current.canBeEdited).toBe(true)
      expect(result.current.canBeDeleted).toBe(true)
    })

    it('allows editing but not deleting custom role with members', async () => {
      const { result } = renderHook(() => useRoleDetails({ roleId: '101' }))

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(result.current.isLoadingRole).toBe(false)
      })

      expect(result.current.role?.name).toBe('custom-role-with-members')
      expect(result.current.canBeEdited).toBe(true)
      expect(result.current.canBeDeleted).toBe(false)
    })
  })
})
