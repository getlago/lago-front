import { allPermissions } from '~/pages/settings/roles/common/permissionsConst'
import { RoleItem } from '~/pages/settings/roles/common/roleTypes'

import { mapPermissionsFromRole } from '../mapPermissionsFromRole'

describe('mapPermissionsFromRole', () => {
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

  it('returns all permissions as false for undefined role', () => {
    const result = mapPermissionsFromRole(undefined)

    expect(Object.keys(result)).toHaveLength(allPermissions.length)
    Object.values(result).forEach((value) => {
      expect(value).toBe(false)
    })
  })

  it('returns all permissions as false for role with no permissions', () => {
    const role = createRole({ permissions: [] })
    const result = mapPermissionsFromRole(role)

    expect(Object.keys(result)).toHaveLength(allPermissions.length)
    Object.values(result).forEach((value) => {
      expect(value).toBe(false)
    })
  })

  it('returns all permissions as true for admin role', () => {
    const role = createRole({ admin: true, permissions: [] })
    const result = mapPermissionsFromRole(role)

    expect(Object.keys(result)).toHaveLength(allPermissions.length)
    Object.values(result).forEach((value) => {
      expect(value).toBe(true)
    })
  })

  it('maps specific permissions correctly', () => {
    const role = createRole({
      permissions: ['plansView', 'plansCreate', 'customersView'],
    })
    const result = mapPermissionsFromRole(role)

    expect(result.plansView).toBe(true)
    expect(result.plansCreate).toBe(true)
    expect(result.customersView).toBe(true)
    expect(result.plansDelete).toBe(false)
    expect(result.plansUpdate).toBe(false)
  })

  it('handles role with all addon permissions', () => {
    const role = createRole({
      permissions: ['addonsCreate', 'addonsDelete', 'addonsUpdate', 'addonsView'],
    })
    const result = mapPermissionsFromRole(role)

    expect(result.addonsCreate).toBe(true)
    expect(result.addonsDelete).toBe(true)
    expect(result.addonsUpdate).toBe(true)
    expect(result.addonsView).toBe(true)
  })

  it('returns correct permission count', () => {
    const result = mapPermissionsFromRole(undefined)

    expect(Object.keys(result).length).toBe(allPermissions.length)
  })

  it('admin flag overrides empty permissions array', () => {
    const role = createRole({
      admin: true,
      permissions: [],
    })
    const result = mapPermissionsFromRole(role)

    expect(result.plansView).toBe(true)
    expect(result.customersCreate).toBe(true)
    expect(result.invoicesView).toBe(true)
  })
})
