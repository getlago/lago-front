import { stringifyOptionValue } from '../stringifyOptionValue'
import { xeroMappingValidationSchema } from '../validationSchema'

const COMPLETE_OPTION = stringifyOptionValue({
  externalId: 'id',
  externalName: 'name',
  externalAccountCode: 'code',
})

describe('xeroMappingValidationSchema', () => {
  describe('GIVEN a single billing entity', () => {
    it.each([
      ['an empty value', '', true],
      ['an undefined value', undefined, true],
      ['a complete option', COMPLETE_OPTION, true],
      ['an option missing its name', 'id:::code:::', false],
      ['a value that is not an option', 'garbage', false],
    ])('THEN should match the all-or-nothing rule with %s', (_, selectedElementValue, expected) => {
      const result = xeroMappingValidationSchema.safeParse({ default: { selectedElementValue } })

      expect(result.success).toBe(expected)
    })
  })
})
