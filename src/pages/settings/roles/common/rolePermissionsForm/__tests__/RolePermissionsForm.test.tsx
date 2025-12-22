import { allPermissions, groupNameMapping, permissionGroupMapping } from '../../permissionsConst'

describe('RolePermissionsForm - Constants', () => {
  it('has permissions defined', () => {
    expect(allPermissions.length).toBeGreaterThan(0)
  })

  it('has permission groups defined', () => {
    expect(Object.keys(permissionGroupMapping).length).toBeGreaterThan(0)
  })

  it('has group name mappings for all groups', () => {
    const groupKeys = Object.keys(permissionGroupMapping)

    groupKeys.forEach((key) => {
      expect(groupNameMapping[key]).toBeDefined()
    })
  })

  it('all permissions in groups are in allPermissions', () => {
    const groupedPermissions = Object.values(permissionGroupMapping).flat()

    groupedPermissions.forEach((permission) => {
      expect(allPermissions).toContain(permission)
    })
  })

  it('has consistent group structure', () => {
    Object.entries(permissionGroupMapping).forEach(([groupName, permissions]) => {
      expect(groupName).toBeTruthy()
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThan(0)
    })
  })

  it('contains expected permission groups', () => {
    const expectedGroups = [
      'addons',
      'analytics',
      'billableMetrics',
      'customers',
      'invoices',
      'plans',
      'subscriptions',
    ]

    expectedGroups.forEach((group) => {
      expect(permissionGroupMapping).toHaveProperty(group)
    })
  })

  it('contains expected permissions', () => {
    const expectedPermissions = ['plansView', 'plansCreate', 'customersView', 'invoicesView']

    expectedPermissions.forEach((permission) => {
      expect(allPermissions).toContain(permission)
    })
  })
})
