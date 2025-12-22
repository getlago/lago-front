import { allPermissions } from '~/pages/settings/roles/common/permissionsConst'
import { RoleItem } from '~/pages/settings/roles/common/roleTypes'

import { mapFromApiToForm } from '../mapFromApiToForm'

describe('mapFromApiToForm', () => {
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

  it('returns empty values for undefined role', () => {
    const result = mapFromApiToForm(undefined)

    expect(result.name).toBe('')
    expect(result.description).toBe('')
    expect(Object.keys(result.permissions)).toHaveLength(allPermissions.length)
    Object.values(result.permissions).forEach((value) => {
      expect(value).toBe(false)
    })
  })

  it('maps role name correctly', () => {
    const role = createRole({ name: 'My Custom Role' })
    const result = mapFromApiToForm(role)

    expect(result.name).toBe('My Custom Role')
  })

  it('maps role description correctly', () => {
    const role = createRole({ description: 'This is a detailed description' })
    const result = mapFromApiToForm(role)

    expect(result.description).toBe('This is a detailed description')
  })

  it('maps permissions from role', () => {
    const role = createRole({
      permissions: ['plansView', 'customersView'],
    })
    const result = mapFromApiToForm(role)

    expect(result.permissions.plansView).toBe(true)
    expect(result.permissions.customersView).toBe(true)
    expect(result.permissions.plansCreate).toBe(false)
  })

  it('maps admin role with all permissions true', () => {
    const role = createRole({ admin: true })
    const result = mapFromApiToForm(role)

    expect(result.name).toBe('test-role')
    Object.values(result.permissions).forEach((value) => {
      expect(value).toBe(true)
    })
  })

  it('handles role with empty description', () => {
    const role = createRole({ description: '' })
    const result = mapFromApiToForm(role)

    expect(result.description).toBe('')
  })

  it('returns all expected form fields', () => {
    const role = createRole()
    const result = mapFromApiToForm(role)

    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('description')
    expect(result).toHaveProperty('permissions')
  })
})
