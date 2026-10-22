import { getSystemRoleKey, isSystemRole } from '../roles'

describe('roles constants', () => {
  describe('getSystemRoleKey', () => {
    it('identifies predefined roles by code', () => {
      expect(getSystemRoleKey({ name: 'Admin', code: 'admin' })).toBe('Admin')
      expect(getSystemRoleKey({ name: 'Finance', code: 'finance' })).toBe('Finance')
      expect(getSystemRoleKey({ name: 'Manager', code: 'manager' })).toBe('Manager')
    })

    it('ignores the name when a code is present', () => {
      expect(getSystemRoleKey({ name: 'Admin', code: 'pt_check' })).toBeUndefined()
    })

    it('falls back to the name when no code is available', () => {
      expect(getSystemRoleKey({ name: 'Finance' })).toBe('Finance')
      expect(getSystemRoleKey({ name: 'Other' })).toBeUndefined()
    })
  })

  describe('isSystemRole', () => {
    it('is false for a custom role named like a predefined one', () => {
      expect(isSystemRole({ name: 'Manager', code: 'custom_manager' })).toBe(false)
    })

    it('is true for a predefined role', () => {
      expect(isSystemRole({ name: 'Manager', code: 'manager' })).toBe(true)
    })
  })
})
