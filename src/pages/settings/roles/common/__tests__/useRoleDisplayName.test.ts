import { renderHook } from '@testing-library/react'

import { RoleItem } from '../roleTypes'
import { useRoleDisplayName } from '../useRoleDisplayName'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('useRoleDisplayName', () => {
  const createRole = (overrides: Partial<RoleItem> = {}): RoleItem => ({
    id: '1',
    organization: null,
    name: 'test-role',
    description: 'Test description',
    admin: false,
    deletedAt: null,
    members: [],
    permissions: [],
    ...overrides,
  })

  it('returns empty string for undefined role', () => {
    const { result } = renderHook(() => useRoleDisplayName())

    expect(result.current.getDisplayName(undefined)).toBe('')
  })

  it('returns translated name for admin system role', () => {
    const { result } = renderHook(() => useRoleDisplayName())
    const adminRole = createRole({ name: 'admin' })

    expect(result.current.getDisplayName(adminRole)).toBe('text_664f035a68227f00e261b7ee')
  })

  it('returns translated name for manager system role', () => {
    const { result } = renderHook(() => useRoleDisplayName())
    const managerRole = createRole({ name: 'manager' })

    expect(result.current.getDisplayName(managerRole)).toBe('text_664f035a68227f00e261b7f0')
  })

  it('returns translated name for finance system role', () => {
    const { result } = renderHook(() => useRoleDisplayName())
    const financeRole = createRole({ name: 'finance' })

    expect(result.current.getDisplayName(financeRole)).toBe('text_664f035a68227f00e261b7f2')
  })

  it('returns role name as-is for custom roles', () => {
    const { result } = renderHook(() => useRoleDisplayName())
    const customRole = createRole({ name: 'My Custom Role' })

    expect(result.current.getDisplayName(customRole)).toBe('My Custom Role')
  })

  it('returns role name as-is for roles not in system roles list', () => {
    const { result } = renderHook(() => useRoleDisplayName())
    const customRole = createRole({ name: 'some-other-role' })

    expect(result.current.getDisplayName(customRole)).toBe('some-other-role')
  })
})
