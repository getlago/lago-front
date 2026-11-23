import { stringifyOptionValue } from '~/pages/settings/integrations/XeroIntegrationMapItemDrawer/stringifyOptionValue'

import { quickbooksMappingValidationSchema } from '../validationSchema'

// QuickBooks items and accounts carry no account code: an option is complete without one.
const COMPLETE_OPTION = stringifyOptionValue({
  externalId: 'id',
  externalName: 'name',
  externalAccountCode: '',
})

describe('quickbooksMappingValidationSchema', () => {
  describe('GIVEN a single billing entity', () => {
    it.each([
      ['an empty value', '', true],
      ['an undefined value', undefined, true],
      ['a complete option', COMPLETE_OPTION, true],
      [
        'an option missing its name',
        stringifyOptionValue({ externalId: 'id', externalName: '', externalAccountCode: '' }),
        false,
      ],
      [
        'an option missing its id',
        stringifyOptionValue({ externalId: '', externalName: 'name', externalAccountCode: '' }),
        false,
      ],
      ['a value that is not an option', 'garbage', false],
    ])('THEN should match the all-or-nothing rule with %s', (_, selectedElementValue, expected) => {
      const result = quickbooksMappingValidationSchema.safeParse({
        default: { selectedElementValue },
      })

      expect(result.success).toBe(expected)
    })
  })
})
