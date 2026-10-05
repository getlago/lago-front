import { CountryCode } from '~/generated/graphql'

import { billingEntityCreateEditValidationSchema } from '../validationSchema'

const validValues = {
  name: 'Acme France',
  code: 'acme_france',
}

describe('billingEntityCreateEditValidationSchema', () => {
  describe('GIVEN a name and a code', () => {
    describe('WHEN every other field is omitted', () => {
      it('THEN should accept the values', () => {
        expect(billingEntityCreateEditValidationSchema.safeParse(validValues).success).toBe(true)
      })
    })
  })

  describe('GIVEN a required field is empty', () => {
    describe('WHEN parsing', () => {
      it.each([['name'], ['code']])('THEN should reject an empty %s', (field) => {
        const result = billingEntityCreateEditValidationSchema.safeParse({
          ...validValues,
          [field]: '',
        })

        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.path).toEqual([field])
      })
    })
  })

  describe('GIVEN a country', () => {
    describe('WHEN it is a known country code', () => {
      it('THEN should accept it', () => {
        expect(
          billingEntityCreateEditValidationSchema.safeParse({
            ...validValues,
            country: CountryCode.Fr,
          }).success,
        ).toBe(true)
      })
    })

    describe('WHEN it is cleared', () => {
      it('THEN should accept it', () => {
        expect(
          billingEntityCreateEditValidationSchema.safeParse({
            ...validValues,
            country: undefined,
          }).success,
        ).toBe(true)
      })
    })

    describe('WHEN it is not a known country code', () => {
      it('THEN should reject it', () => {
        expect(
          billingEntityCreateEditValidationSchema.safeParse({
            ...validValues,
            country: 'XX',
          }).success,
        ).toBe(false)
      })
    })
  })
})
