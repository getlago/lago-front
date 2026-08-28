import { CurrencyEnum, RateCardRateForDrawerFragment } from '~/generated/graphql'

import { buildRateCardRate } from '../../../__tests__/fixtures'
import { mapRateToFormValues, toFormProperties } from '../mapRateToFormValues'

const buildDrawerRate = (
  overrides: Partial<RateCardRateForDrawerFragment> = {},
): RateCardRateForDrawerFragment =>
  ({ ...buildRateCardRate(), ...overrides }) as RateCardRateForDrawerFragment

describe('toFormProperties', () => {
  describe('GIVEN properties carrying range rows', () => {
    describe('WHEN they are mapped back into the form', () => {
      // The API sends `__typename` on every row, which the typed PropertiesInput rejects on
      // the way back in.
      it('THEN the rows are rebuilt without __typename', () => {
        const properties = toFormProperties({
          __typename: 'Properties',
          graduatedRanges: [
            {
              __typename: 'GraduatedRange',
              fromValue: 0,
              toValue: 10,
              flatAmount: '1',
              perUnitAmount: '2',
            },
          ],
          volumeRanges: [
            {
              __typename: 'VolumeRange',
              fromValue: 0,
              toValue: 10,
              flatAmount: '3',
              perUnitAmount: '4',
            },
          ],
          graduatedPercentageRanges: [
            {
              __typename: 'GraduatedPercentageRange',
              fromValue: 0,
              toValue: 10,
              flatAmount: '5',
              rate: '6',
            },
          ],
        } as RateCardRateForDrawerFragment['rateProperties'])

        expect(properties.graduatedRanges).toEqual([
          { fromValue: 0, toValue: 10, flatAmount: '1', perUnitAmount: '2' },
        ])
        expect(properties.volumeRanges).toEqual([
          { fromValue: 0, toValue: 10, flatAmount: '3', perUnitAmount: '4' },
        ])
        expect(properties.graduatedPercentageRanges).toEqual([
          { fromValue: 0, toValue: 10, flatAmount: '5', rate: '6' },
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
      // A rate saved without one stores 0, which must read as "none set" rather than a
      // configured zero floor.
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
