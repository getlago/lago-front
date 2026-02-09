import {
  resendEmailFormDefaultValues,
  ResendEmailFormDefaultValues,
  resendEmailFormValidationSchema,
} from '~/components/emails/resendEmail/formInitialization'

describe('formInitialization', () => {
  describe('resendEmailFormDefaultValues', () => {
    it('has undefined values for all fields', () => {
      expect(resendEmailFormDefaultValues).toEqual({
        to: undefined,
        cc: undefined,
        bcc: undefined,
      })
    })

    it('matches ResendEmailFormDefaultValues type', () => {
      const values: ResendEmailFormDefaultValues = resendEmailFormDefaultValues

      expect(values).toBeDefined()
    })
  })

  describe('resendEmailFormValidationSchema', () => {
    it('validates correct email format in to field', () => {
      const validData = {
        to: [{ value: 'test@example.com' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('validates correct email format in cc field', () => {
      const validData = {
        cc: [{ value: 'test@example.com' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('validates correct email format in bcc field', () => {
      const validData = {
        bcc: [{ value: 'test@example.com' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('rejects invalid email format in to field', () => {
      const invalidData = {
        to: [{ value: 'invalid-email' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('rejects invalid email format in cc field', () => {
      const invalidData = {
        cc: [{ value: 'invalid-email' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('rejects invalid email format in bcc field', () => {
      const invalidData = {
        bcc: [{ value: 'invalid-email' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('accepts multiple valid emails in to field', () => {
      const validData = {
        to: [{ value: 'test1@example.com' }, { value: 'test2@example.com' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('accepts multiple valid emails in cc field', () => {
      const validData = {
        cc: [{ value: 'test1@example.com' }, { value: 'test2@example.com' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('accepts multiple valid emails in bcc field', () => {
      const validData = {
        bcc: [{ value: 'test1@example.com' }, { value: 'test2@example.com' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('accepts undefined values for optional fields', () => {
      const validData = {
        to: undefined,
        cc: undefined,
        bcc: undefined,
      }

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('accepts empty object', () => {
      const validData = {}

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('validates all fields together with mixed valid emails', () => {
      const validData = {
        to: [{ value: 'to@example.com' }],
        cc: [{ value: 'cc@example.com' }],
        bcc: [{ value: 'bcc@example.com' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('rejects when one field has invalid email among valid ones', () => {
      const invalidData = {
        to: [{ value: 'valid@example.com' }],
        cc: [{ value: 'invalid-email' }],
        bcc: [{ value: 'valid@example.com' }],
      }

      const result = resendEmailFormValidationSchema.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })
})
