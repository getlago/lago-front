import { CurrencyEnum } from '~/generated/graphql'

import {
  buildCurrenciesMappingInput,
  netsuiteAdditionalMappingValidationSchema,
} from '../validationSchema'

const isValid = (value: unknown): boolean =>
  netsuiteAdditionalMappingValidationSchema.safeParse(value).success

describe('netsuiteAdditionalMappingValidationSchema', () => {
  describe('GIVEN no mapping row', () => {
    describe('WHEN the array is empty', () => {
      // Emptying every row is the only way to delete the whole mapping, so an
      // empty array has to stay submittable.
      it('THEN should be valid', () => {
        expect(isValid({ default: [] })).toBe(true)
      })
    })
  })

  describe('GIVEN mapping rows', () => {
    describe('WHEN every row has both a currency and an external code', () => {
      it('THEN should be valid', () => {
        expect(
          isValid({
            default: [
              { currencyCode: CurrencyEnum.Eur, currencyExternalCode: 'EUR-EXT' },
              { currencyCode: CurrencyEnum.Usd, currencyExternalCode: 'USD-EXT' },
            ],
          }),
        ).toBe(true)
      })
    })

    describe.each([
      ['the currency is missing', { currencyCode: undefined, currencyExternalCode: 'EUR-EXT' }],
      ['the external code is empty', { currencyCode: CurrencyEnum.Eur, currencyExternalCode: '' }],
      ['both are missing', { currencyCode: undefined, currencyExternalCode: '' }],
    ])('WHEN %s', (_, row) => {
      it('THEN should be invalid', () => {
        expect(isValid({ default: [row] })).toBe(false)
      })
    })

    describe('WHEN only a later row is incomplete', () => {
      it('THEN should be invalid', () => {
        expect(
          isValid({
            default: [
              { currencyCode: CurrencyEnum.Eur, currencyExternalCode: 'EUR-EXT' },
              { currencyCode: CurrencyEnum.Usd, currencyExternalCode: '' },
            ],
          }),
        ).toBe(false)
      })
    })
  })
})

describe('buildCurrenciesMappingInput', () => {
  describe('GIVEN rows carrying a currency', () => {
    describe('WHEN building the mutation input', () => {
      it('THEN should keep every row in order', () => {
        expect(
          buildCurrenciesMappingInput({
            default: [
              { currencyCode: CurrencyEnum.Eur, currencyExternalCode: 'EUR-EXT' },
              { currencyCode: CurrencyEnum.Usd, currencyExternalCode: 'USD-EXT' },
            ],
          }),
        ).toEqual([
          { currencyCode: CurrencyEnum.Eur, currencyExternalCode: 'EUR-EXT' },
          { currencyCode: CurrencyEnum.Usd, currencyExternalCode: 'USD-EXT' },
        ])
      })
    })
  })

  describe('GIVEN a row without a currency', () => {
    describe('WHEN building the mutation input', () => {
      it('THEN should drop it', () => {
        expect(
          buildCurrenciesMappingInput({
            default: [{ currencyCode: undefined, currencyExternalCode: 'EUR-EXT' }],
          }),
        ).toEqual([])
      })
    })
  })
})
