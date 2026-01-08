import { renderHook, waitFor } from '@testing-library/react'

import { RoleItem } from '~/core/constants/roles'
import { GetRolesListDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { allRoles } from './mock/allRoles'

import { useRolesList } from '../useRolesList'

const mocks: TestMocksType = [
  {
    request: {
      query: GetRolesListDocument,
    },
    result: {
      data: {
        roles: allRoles,
      },
    },
  },
]

const wrapper = ({ children }: { children: React.ReactNode }) =>
  AllTheProviders({
    children,
    mocks,
    forceTypenames: true,
  })

describe('useRolesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useRolesList(), { wrapper })

    expect(result.current.isLoadingRoles).toBe(true)
    expect(result.current.roles).toEqual([])
  })

  it('returns roles after loading', async () => {
    const { result } = renderHook(() => useRolesList(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoadingRoles).toBe(false)
    })

    expect(result.current.roles).toHaveLength(allRoles.length)
    expect(result.current.roles[0]?.id).toBe(allRoles[0]?.id)
    expect(result.current.roles[0]?.name).toBe(allRoles[0]?.name)
  })

  it('returns all three system roles', async () => {
    const { result } = renderHook(() => useRolesList(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoadingRoles).toBe(false)
    })

    const roleNames = result.current.roles.map((r: RoleItem) => r?.name)

    expect(roleNames).toContain('Admin')
    expect(roleNames).toContain('Manager')
    expect(roleNames).toContain('Finance')
  })
})
