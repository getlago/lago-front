import { CurrencyEnum, RateCardRateForDrawerFragment } from '~/generated/graphql'

import { buildRateCardRate, buildRateProperties } from '../../../__tests__/fixtures'
import { mapRateToFormValues, toFormProperties } from '../mapRateToFormValues'

const buildDrawerRate = (
  overrides: Partial<RateCardRateForDrawerFragment> = {},
): RateCardRateForDrawerFragment =>
  ({ ...buildRateCardRate(), ...overrides }) as RateCardRateForDrawerFragment

describe('toFormProperties', () => {
  describe('GIVEN tiers that only name their upper bound', () => {
    describe('WHEN they are mapped back into the form', () => {
      // The API sends `__typename` on every row, which `PropertiesInput` rejects.
      it('THEN each tier starts where the previous one ends, without __typename', () => {
        const properties = toFormProperties(
          buildRateProperties({
            graduatedRanges: [
              { __typename: 'RateTier', toValue: '10', flatAmount: '1', perUnitAmount: '2' },
              { __typename: 'RateTier', toValue: null, flatAmount: '0', perUnitAmount: '1' },
            ],
            volumeRanges: [
              { __typename: 'RateTier', toValue: '0.5', flatAmount: '3', perUnitAmount: '4' },
              { __typename: 'RateTier', toValue: null, flatAmount: '0', perUnitAmount: '1' },
            ],
            graduatedPercentageRanges: [
              { __typename: 'RatePercentageTier', toValue: '10', flatAmount: '5', rate: '6' },
              { __typename: 'RatePercentageTier', toValue: null, flatAmount: '0', rate: '1' },
            ],
          }),
        )

        expect(properties.graduatedRanges).toEqual([
          { fromValue: 0, toValue: 10, flatAmount: '1', perUnitAmount: '2' },
          { fromValue: 10, toValue: null, flatAmount: '0', perUnitAmount: '1' },
        ])
        expect(properties.volumeRanges).toEqual([
          { fromValue: 0, toValue: 0.5, flatAmount: '3', perUnitAmount: '4' },
          { fromValue: 0.5, toValue: null, flatAmount: '0', perUnitAmount: '1' },
        ])
        expect(properties.graduatedPercentageRanges).toEqual([
          { fromValue: 0, toValue: 10, flatAmount: '5', rate: '6' },
          { fromValue: 10, toValue: null, flatAmount: '0', rate: '1' },
        ])
      })
    })
  })
})

describe('mapRateToFormValues', () => {
  describe('GIVEN a rate being edited', () => {
    describe('WHEN the drawer seeds its form', () => {
      it('THEN numeric fields are handed over as the strings the inputs edit', () => {
        const values = mapRateToFormValues(
          buildDrawerRate({ billingIntervalCount: 3 }),
          CurrencyEnum.Usd,
        )

        expect(values.billingIntervalCount).toBe('3')
        expect(values.code).toBe('rate_01_24_2026')
        expect(values.effectiveFrom).toBe('2026-01-24T00:00:00.000Z')
      })
    })

    describe('WHEN the rate stores a spending minimum', () => {
      // Stored in the currency's smallest unit; the form edits a decimal amount.
      it('THEN it is deserialized into the currency unit', () => {
        const values = mapRateToFormValues(
          buildDrawerRate({ minAmountCents: '1250' }),
          CurrencyEnum.Usd,
        )

        expect(values.minAmountCents).toBe('12.5')
      })
    })

    describe('WHEN the rate stores no spending minimum', () => {
      // A rate saved without one stores 0, which must read as "none set".
      it('THEN the field is left empty', () => {
        const values = mapRateToFormValues(
          buildDrawerRate({ minAmountCents: '0' }),
          CurrencyEnum.Usd,
        )

        expect(values.minAmountCents).toBe('')
      })
    })

    describe('WHEN the card prices in the organization currency', () => {
      it('THEN the conversion rate is left empty rather than "null"', () => {
        const values = mapRateToFormValues(
          buildDrawerRate({ appliedPricingUnitConversionRate: null }),
          CurrencyEnum.Usd,
        )

        expect(values.conversionRate).toBe('')
      })
    })

    describe('WHEN the card prices in a custom pricing unit', () => {
      it('THEN the conversion rate is handed over as a string', () => {
        const values = mapRateToFormValues(
          buildDrawerRate({ appliedPricingUnitConversionRate: 0.5 }),
          CurrencyEnum.Usd,
        )

        expect(values.conversionRate).toBe('0.5')
      })
    })
  })
})
