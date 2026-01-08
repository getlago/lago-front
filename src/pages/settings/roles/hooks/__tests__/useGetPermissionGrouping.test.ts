import { renderHook } from '@testing-library/react'

import { useGetPermissionGrouping } from '../useGetPermissionGrouping'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('useGetPermissionGrouping', () => {
  it('returns all groups from permissionGroupMapping', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['AddonsCreate', 'AnalyticsView', 'PlansView', 'CustomersView']),
    )

    expect(result.current.permissionGrouping).toHaveProperty('addons')
    expect(result.current.permissionGrouping).toHaveProperty('analytics')
    expect(result.current.permissionGrouping).toHaveProperty('plans')
    expect(result.current.permissionGrouping).toHaveProperty('customers')
  })

  it('returns empty object on empty array', () => {
    const { result } = renderHook(() => useGetPermissionGrouping([]))

    expect(result.current.permissionGrouping).toEqual({})
  })

  it('maps permissions to their respective groups', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['PlansView', 'AddonsCreate', 'AddonsView']),
    )

    const { permissionGrouping } = result.current

    expect(permissionGrouping.plans.permissions).toHaveLength(1)
    expect(permissionGrouping.plans.permissions[0].name).toBe('plansView')
    expect(permissionGrouping.addons.permissions).toHaveLength(2)
    expect(permissionGrouping.addons.permissions[0].name).toBe('addonsCreate')
    expect(permissionGrouping.addons.permissions[1].name).toBe('addonsView')
  })

  it('does not add "other" key when all permissions are mapped', () => {
    const { result } = renderHook(() => useGetPermissionGrouping(['PlansView', 'PlansCreate']))

    expect(result.current.permissionGrouping).not.toHaveProperty('other')
  })

  it('adds unmapped permissions to "other" key', () => {
    const { result } = renderHook(() => useGetPermissionGrouping(['unknownPermission' as never]))

    expect(result.current.permissionGrouping).toHaveProperty('other')
    expect(result.current.permissionGrouping.other.permissions).toHaveLength(1)
    expect(result.current.permissionGrouping.other.permissions[0].name).toBe('unknownPermission')
  })

  it('adds multiple unmapped permissions to "other" key', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['unknownPermission1' as never, 'unknownPermission2View' as never]),
    )

    expect(result.current.permissionGrouping.other.permissions).toHaveLength(2)
  })

  it('filters out hidden permissions', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['AuditLogsView', 'DataApiView', 'PlansView']),
    )

    const { permissionGrouping } = result.current

    expect(permissionGrouping.auditLogs).toBeUndefined()
    expect(permissionGrouping.dataApi).toBeUndefined()
    expect(permissionGrouping.plans.permissions).toHaveLength(1)
    expect(permissionGrouping.plans.permissions[0].name).toBe('plansView')
  })

  it('does not include hidden permissions in "other" key', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['AuditLogsView', 'unknownPermission' as never]),
    )

    expect(result.current.permissionGrouping.other.permissions).toHaveLength(1)
    expect(result.current.permissionGrouping.other.permissions[0].name).toBe('unknownPermission')
  })

  it('returns translated displayName and description strings', () => {
    const { result } = renderHook(() => useGetPermissionGrouping(['PlansView', 'PlansCreate']))

    const plansView = result.current.permissionGrouping.plans.permissions.find(
      (p) => p.name === 'PlansView',
    )
    const plansCreate = result.current.permissionGrouping.plans.permissions.find(
      (p) => p.name === 'PlansCreate',
    )

    expect(typeof plansView?.description).toBe('string')
    expect(typeof plansCreate?.description).toBe('string')
  })

  it('returns correct group displayName', () => {
    const { result } = renderHook(() => useGetPermissionGrouping(['PlansView']))

    expect(result.current.permissionGrouping.plans.displayName).toBe(
      'text_62442e40cea25600b0b6d85a',
    )
  })
})
