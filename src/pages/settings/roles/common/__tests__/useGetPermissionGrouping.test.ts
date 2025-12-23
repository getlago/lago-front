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
      useGetPermissionGrouping(['addonsCreate', 'analyticsView', 'plansView', 'customersView']),
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
      useGetPermissionGrouping(['plansView', 'addonsCreate', 'addonsView']),
    )

    const { permissionGrouping } = result.current

    expect(permissionGrouping.plans.permissions).toHaveLength(1)
    expect(permissionGrouping.plans.permissions[0].name).toBe('plansView')
    expect(permissionGrouping.addons.permissions).toHaveLength(2)
    expect(permissionGrouping.addons.permissions[0].name).toBe('addonsCreate')
    expect(permissionGrouping.addons.permissions[1].name).toBe('addonsView')
  })

  it('sets isReadPermission to true for permissions ending with View', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['analyticsView', 'analyticsOverdueBalancesView']),
    )

    const analyticsPermissions = result.current.permissionGrouping.analytics.permissions
    const analyticsView = analyticsPermissions.find((p) => p.name === 'analyticsView')
    const overdueView = analyticsPermissions.find((p) => p.name === 'analyticsOverdueBalancesView')

    expect(analyticsView?.isReadPermission).toBe(true)
    expect(overdueView?.isReadPermission).toBe(true)
  })

  it('sets isReadPermission to false for non-View permissions', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['addonsCreate', 'addonsDelete', 'addonsUpdate']),
    )

    const addonsPermissions = result.current.permissionGrouping.addons.permissions
    const addonsCreate = addonsPermissions.find((p) => p.name === 'addonsCreate')
    const addonsDelete = addonsPermissions.find((p) => p.name === 'addonsDelete')
    const addonsUpdate = addonsPermissions.find((p) => p.name === 'addonsUpdate')

    expect(addonsCreate?.isReadPermission).toBe(false)
    expect(addonsDelete?.isReadPermission).toBe(false)
    expect(addonsUpdate?.isReadPermission).toBe(false)
  })

  it('does not add "other" key when all permissions are mapped', () => {
    const { result } = renderHook(() => useGetPermissionGrouping(['plansView', 'plansCreate']))

    expect(result.current.permissionGrouping).not.toHaveProperty('other')
  })

  it('adds unmapped permissions to "other" key', () => {
    const { result } = renderHook(() => useGetPermissionGrouping(['unknownPermission' as never]))

    expect(result.current.permissionGrouping).toHaveProperty('other')
    expect(result.current.permissionGrouping.other.permissions).toHaveLength(1)
    expect(result.current.permissionGrouping.other.permissions[0].name).toBe('unknownPermission')
    expect(result.current.permissionGrouping.other.permissions[0].isReadPermission).toBe(false)
  })

  it('adds multiple unmapped permissions to "other" key', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['unknownPermission1' as never, 'unknownPermission2View' as never]),
    )

    expect(result.current.permissionGrouping.other.permissions).toHaveLength(2)
    expect(result.current.permissionGrouping.other.permissions[0].isReadPermission).toBe(false)
    expect(result.current.permissionGrouping.other.permissions[1].isReadPermission).toBe(true)
  })

  it('filters out hidden permissions', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['auditLogsView', 'dataApiView', 'plansView']),
    )

    const { permissionGrouping } = result.current

    expect(permissionGrouping.auditLogs).toBeUndefined()
    expect(permissionGrouping.dataApi).toBeUndefined()
    expect(permissionGrouping.plans.permissions).toHaveLength(1)
    expect(permissionGrouping.plans.permissions[0].name).toBe('plansView')
    expect(permissionGrouping.plans.permissions[0].isReadPermission).toBe(true)
  })

  it('does not include hidden permissions in "other" key', () => {
    const { result } = renderHook(() =>
      useGetPermissionGrouping(['auditLogsView', 'unknownPermission' as never]),
    )

    expect(result.current.permissionGrouping.other.permissions).toHaveLength(1)
    expect(result.current.permissionGrouping.other.permissions[0].name).toBe('unknownPermission')
    expect(result.current.permissionGrouping.other.permissions[0].isReadPermission).toBe(false)
  })

  it('returns translated displayName and description strings', () => {
    const { result } = renderHook(() => useGetPermissionGrouping(['plansView', 'plansCreate']))

    const plansView = result.current.permissionGrouping.plans.permissions.find(
      (p) => p.name === 'plansView',
    )
    const plansCreate = result.current.permissionGrouping.plans.permissions.find(
      (p) => p.name === 'plansCreate',
    )

    expect(typeof plansView?.description).toBe('string')
    expect(typeof plansCreate?.description).toBe('string')
  })

  it('returns correct group displayName', () => {
    const { result } = renderHook(() => useGetPermissionGrouping(['plansView']))

    expect(result.current.permissionGrouping.plans.displayName).toBe(
      'text_62442e40cea25600b0b6d85a',
    )
  })
})
