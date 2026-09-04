import { formatValue, ValueFormatterType } from '~/components/form/TextInput'

import { walletPageTopUpValidationSchema } from '../validationSchema'

describe('walletPageTopUpValidationSchema', () => {
  describe('GIVEN a positive amount formatted by AmountInputField', () => {
    it.each<[string, ValueFormatterType[], string]>([
      ['a zero-decimal currency', ['positiveNumber', 'int'], '10'],
      ['a two-decimal currency', ['positiveNumber', 'decimal'], '10.25'],
      ['a three-decimal currency', ['positiveNumber', 'triDecimal'], '10.251'],
      ['a four-decimal currency', ['positiveNumber', 'quadDecimal'], '10.2514'],
    ])('THEN should accept the runtime value for %s', (_, formatters, input) => {
      const amount = formatValue(input, formatters)

      expect(walletPageTopUpValidationSchema.safeParse({ amount }).success).toBe(true)
    })
  })

  describe('GIVEN an amount that is not positive', () => {
    it.each(['', '0', 0])('THEN should reject %p', (amount) => {
      expect(walletPageTopUpValidationSchema.safeParse({ amount }).success).toBe(false)
    })
  })
})
