import { createPricingUnitValidationSchema } from '../validationSchema'

describe('createPricingUnitValidationSchema', () => {
  describe('GIVEN valid form values', () => {
    it.each([
      [{ name: 'Unit', code: 'UNIT', shortName: 'UNI', description: '' }],
      [{ name: 'Unit', code: 'UNIT', shortName: 'U', description: 'Optional description' }],
      [{ name: 'Unit', code: 'UNIT', shortName: 'UNI' }],
    ])('THEN validation passes for valid values', (values) => {
      const result = createPricingUnitValidationSchema.safeParse(values)

      expect(result.success).toBe(true)
    })
  })

  describe('GIVEN name is invalid', () => {
    describe('WHEN name is empty', () => {
      it('THEN validation fails', () => {
        const result = createPricingUnitValidationSchema.safeParse({
          name: '',
          code: 'UNIT',
          shortName: 'UNI',
        })

        expect(result.success).toBe(false)
      })
    })
  })

  describe('GIVEN code is invalid', () => {
    describe('WHEN code is empty', () => {
      it('THEN validation fails', () => {
        const result = createPricingUnitValidationSchema.safeParse({
          name: 'Unit',
          code: '',
          shortName: 'UNI',
        })

        expect(result.success).toBe(false)
      })
    })
  })

  describe('GIVEN shortName is invalid', () => {
    describe('WHEN shortName is empty', () => {
      it('THEN validation fails', () => {
        const result = createPricingUnitValidationSchema.safeParse({
          name: 'Unit',
          code: 'UNIT',
          shortName: '',
        })

        expect(result.success).toBe(false)
      })
    })

    describe('WHEN shortName exceeds 3 characters', () => {
      it('THEN validation fails', () => {
        const result = createPricingUnitValidationSchema.safeParse({
          name: 'Unit',
          code: 'UNIT',
          shortName: 'UNIT',
        })

        expect(result.success).toBe(false)
      })
    })
  })
})
