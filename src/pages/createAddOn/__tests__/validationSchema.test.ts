import { CurrencyEnum } from '~/generated/graphql'

import { addOnFormSchema, AddOnFormValues, emptyAddOnDefaultValues } from '../validationSchema'

describe('addOnFormSchema', () => {
  const createValidAddOnData = (overrides: Partial<AddOnFormValues> = {}): AddOnFormValues => ({
    name: 'Test Add-on',
    code: 'TEST_ADD_ON',
    description: '',
    amountCents: '100',
    amountCurrency: CurrencyEnum.Usd,
    taxes: [],
    ...overrides,
  })

  describe('GIVEN basic field validation', () => {
    describe('WHEN all fields are valid', () => {
      it('THEN should pass validation', () => {
        const result = addOnFormSchema.safeParse(createValidAddOnData())

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN name is empty', () => {
      it('THEN should fail validation with error on name field', () => {
        const result = addOnFormSchema.safeParse(createValidAddOnData({ name: '' }))

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.find((issue) => issue.path.includes('name'))).toBeDefined()
        }
      })
    })

    describe('WHEN code is empty', () => {
      it('THEN should fail validation with error on code field', () => {
        const result = addOnFormSchema.safeParse(createValidAddOnData({ code: '' }))

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.find((issue) => issue.path.includes('code'))).toBeDefined()
        }
      })
    })

    describe('WHEN amountCurrency is missing', () => {
      it('THEN should fail validation with error on amountCurrency field', () => {
        const data = createValidAddOnData()

        // @ts-expect-error — intentionally removing a required enum field for the test
        delete data.amountCurrency

        const result = addOnFormSchema.safeParse(data)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(
            result.error.issues.find((issue) => issue.path.includes('amountCurrency')),
          ).toBeDefined()
        }
      })
    })
  })

  describe('GIVEN amountCents validation', () => {
    describe('WHEN amountCents is invalid', () => {
      it.each([
        ['undefined', undefined],
        ['empty string', ''],
        ['not a number', 'abc'],
        ['below the 0.01 minimum', '0.001'],
        // AmountInput emits a string for every currency, 0-decimal ones included
        ['a raw number', 100],
      ])('THEN should fail validation for %s', (_, amountCents) => {
        const result = addOnFormSchema.safeParse(
          createValidAddOnData({ amountCents: amountCents as AddOnFormValues['amountCents'] }),
        )

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(
            result.error.issues.find((issue) => issue.path.includes('amountCents')),
          ).toBeDefined()
        }
      })
    })

    describe('WHEN amountCents is valid', () => {
      it.each([
        ['exactly the 0.01 minimum', '0.01'],
        ['a string value', '100'],
        ['a whole string value', '1'],
      ])('THEN should pass validation for %s', (_, amountCents) => {
        const result = addOnFormSchema.safeParse(
          createValidAddOnData({ amountCents: amountCents as AddOnFormValues['amountCents'] }),
        )

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN the empty default values', () => {
    describe('WHEN validated', () => {
      it('THEN should fail because amountCents is not set', () => {
        const result = addOnFormSchema.safeParse(emptyAddOnDefaultValues)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(
            result.error.issues.find((issue) => issue.path.includes('amountCents')),
          ).toBeDefined()
        }
      })
    })
  })
})
