import {
  netsuiteMappingDefaultValues,
  netsuiteNonTaxMappingValidationSchema,
  netsuiteTaxMappingValidationSchema,
} from '../validationSchema'

const EMPTY_ENTRY = netsuiteMappingDefaultValues.default

const TAX_FILLED = { taxCode: 'code', taxNexus: 'nexus', taxType: 'type' }
const EXTERNAL_FILLED = { externalId: 'id', externalName: 'name', externalAccountCode: 'code' }

describe('netsuite mapping validation schemas', () => {
  describe('GIVEN the tax context schema', () => {
    it.each([
      ['an empty entry', {}, true],
      ['every tax field filled', TAX_FILLED, true],
      ['one tax field filled', { taxNexus: 'nexus' }, false],
      ['tax and external fields filled', { ...TAX_FILLED, ...EXTERNAL_FILLED }, true],
      [
        'one tax field filled next to external fields',
        { taxNexus: 'nexus', ...EXTERNAL_FILLED },
        false,
      ],
    ])('THEN should match the all-or-nothing rule with %s', (_, overrides, expected) => {
      const result = netsuiteTaxMappingValidationSchema.safeParse({
        default: { ...EMPTY_ENTRY, ...overrides },
      })

      expect(result.success).toBe(expected)
    })

    describe('WHEN the tax fields are cleared on an item that also carries external values', () => {
      // Regression: the external values are hidden in tax context but seeded from the stored
      // item, and they used to keep the entry "filled", so the mapping could not be deleted.
      it('THEN should pass so the mapping can be deleted', () => {
        const result = netsuiteTaxMappingValidationSchema.safeParse({
          default: { ...EMPTY_ENTRY, ...EXTERNAL_FILLED },
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN the non-tax context schema', () => {
    it.each([
      ['an empty entry', {}, true],
      ['every external field filled', EXTERNAL_FILLED, true],
      ['two external fields filled', { externalId: 'id', externalName: 'name' }, false],
      ['only tax fields filled', TAX_FILLED, true],
    ])('THEN should match the all-or-nothing rule with %s', (_, overrides, expected) => {
      const result = netsuiteNonTaxMappingValidationSchema.safeParse({
        default: { ...EMPTY_ENTRY, ...overrides },
      })

      expect(result.success).toBe(expected)
    })
  })
})
