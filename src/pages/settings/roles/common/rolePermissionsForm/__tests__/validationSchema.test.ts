import { validationSchema } from '../validationSchema'

describe('validationSchema', () => {
  describe('name field', () => {
    it('accepts valid name', () => {
      const result = validationSchema.safeParse({
        name: 'My Role',
        description: 'Description',
        permissions: { plansView: true },
      })

      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = validationSchema.safeParse({
        name: '',
        description: 'Description',
        permissions: { plansView: true },
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
        expect(result.error.issues[0].message).toBe('text_1766155139328b95i4fjkwe9')
      }
    })

    it('accepts single character name', () => {
      const result = validationSchema.safeParse({
        name: 'A',
        description: '',
        permissions: { plansView: true },
      })

      expect(result.success).toBe(true)
    })

    it('accepts long name', () => {
      const result = validationSchema.safeParse({
        name: 'A'.repeat(100),
        description: '',
        permissions: { plansView: true },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('description field', () => {
    it('accepts empty description', () => {
      const result = validationSchema.safeParse({
        name: 'Role Name',
        description: '',
        permissions: { plansView: true },
      })

      expect(result.success).toBe(true)
    })

    it('accepts long description', () => {
      const result = validationSchema.safeParse({
        name: 'Role Name',
        description: 'A'.repeat(500),
        permissions: { plansView: true },
      })

      expect(result.success).toBe(true)
    })

    it('accepts description with special characters', () => {
      const result = validationSchema.safeParse({
        name: 'Role Name',
        description: 'This role can: view, edit & delete items!',
        permissions: { plansView: true },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('permissions field', () => {
    it('accepts valid permissions', () => {
      const result = validationSchema.safeParse({
        name: 'Role Name',
        description: 'Description',
        permissions: {
          plansView: true,
          plansCreate: false,
          customersView: true,
        },
      })

      expect(result.success).toBe(true)
    })

    it('accepts empty permissions object', () => {
      const result = validationSchema.safeParse({
        name: 'Role Name',
        description: 'Description',
        permissions: {},
      })

      expect(result.success).toBe(true)
    })

    it('accepts all permissions set to false', () => {
      const result = validationSchema.safeParse({
        name: 'Role Name',
        description: 'Description',
        permissions: {
          plansView: false,
          plansCreate: false,
        },
      })

      expect(result.success).toBe(true)
    })

    it('accepts all permissions set to true', () => {
      const result = validationSchema.safeParse({
        name: 'Role Name',
        description: 'Description',
        permissions: {
          plansView: true,
          plansCreate: true,
          customersView: true,
          customersCreate: true,
        },
      })

      expect(result.success).toBe(true)
    })
  })

  describe('complete form validation', () => {
    it('validates a complete valid form', () => {
      const result = validationSchema.safeParse({
        name: 'Custom Admin Role',
        description: 'A role with custom admin permissions',
        permissions: {
          plansView: true,
          plansCreate: true,
          plansUpdate: true,
          plansDelete: false,
          customersView: true,
        },
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Custom Admin Role')
        expect(result.data.description).toBe('A role with custom admin permissions')
        expect(result.data.permissions.plansView).toBe(true)
      }
    })

    it('fails when name is missing', () => {
      const result = validationSchema.safeParse({
        description: 'Description',
        permissions: { plansView: true },
      })

      expect(result.success).toBe(false)
    })

    it('fails when permissions is missing', () => {
      const result = validationSchema.safeParse({
        name: 'Role Name',
        description: 'Description',
      })

      expect(result.success).toBe(false)
    })
  })
})
