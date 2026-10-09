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
      ['only external fields filled', EXTERNAL_FILLED, false],
      ['tax and external fields filled', { ...TAX_FILLED, ...EXTERNAL_FILLED }, true],
    ])('THEN should match the all-or-nothing rule with %s', (_, overrides, expected) => {
      const result = netsuiteTaxMappingValidationSchema.safeParse({
        default: { ...EMPTY_ENTRY, ...overrides },
      })

      expect(result.success).toBe(expected)
    })
  })

  describe('GIVEN the non-tax context schema', () => {
    it.each([
      ['an empty entry', {}, true],
      ['every external field filled', EXTERNAL_FILLED, true],
      ['two external fields filled', { externalId: 'id', externalName: 'name' }, false],
      ['only tax fields filled', TAX_FILLED, false],
    ])('THEN should match the all-or-nothing rule with %s', (_, overrides, expected) => {
      const result = netsuiteNonTaxMappingValidationSchema.safeParse({
        default: { ...EMPTY_ENTRY, ...overrides },
      })

      expect(result.success).toBe(expected)
    })
  })
})
