import { sortAndFormatThresholds } from '~/components/alerts/utils'
import { AlertThreshold, CurrencyEnum } from '~/generated/graphql'

const threshold = (overrides: Partial<AlertThreshold> = {}): AlertThreshold => ({
  code: 'threshold-code',
  recurring: false,
  value: '1000',
  ...overrides,
})

describe('sortAndFormatThresholds', () => {
  describe('GIVEN an alert holding amounts', () => {
    describe('WHEN formatting its thresholds', () => {
      it('THEN should deserialize the value from cents', () => {
        const result = sortAndFormatThresholds([threshold()], CurrencyEnum.Usd, false)

        expect(result).toEqual([expect.objectContaining({ value: '10' })])
      })

      it('THEN should keep the other threshold fields untouched', () => {
        const result = sortAndFormatThresholds(
          [threshold({ code: 'my-code' })],
          CurrencyEnum.Usd,
          false,
        )

        expect(result).toEqual([{ code: 'my-code', recurring: false, value: '10' }])
      })
    })
  })

  describe('GIVEN an alert holding units', () => {
    describe('WHEN formatting its thresholds', () => {
      it.each([
        ['12.99', '12'],
        ['12', '12'],
        ['0.5', '0'],
      ])('THEN should truncate %s to %s', (value, expected) => {
        const result = sortAndFormatThresholds([threshold({ value })], CurrencyEnum.Usd, true)

        expect(result).toEqual([expect.objectContaining({ value: expected })])
      })
    })
  })

  describe('GIVEN a recurring threshold placed first', () => {
    describe('WHEN formatting the thresholds', () => {
      it('THEN should move it last, since the table maps row indexes on that order', () => {
        const result = sortAndFormatThresholds(
          [
            threshold({ code: 'recurring', recurring: true, value: '5' }),
            threshold({ code: 'first', value: '10' }),
            threshold({ code: 'second', value: '20' }),
          ],
          CurrencyEnum.Usd,
          true,
        )

        expect(result.map(({ code }) => code)).toEqual(['first', 'second', 'recurring'])
      })
    })
  })

  describe('GIVEN non-recurring thresholds with an empty value', () => {
    describe('WHEN formatting the thresholds', () => {
      it('THEN should push the empty ones after the filled ones', () => {
        const result = sortAndFormatThresholds(
          [threshold({ code: 'empty', value: '' }), threshold({ code: 'filled', value: '10' })],
          CurrencyEnum.Usd,
          true,
        )

        expect(result.map(({ code }) => code)).toEqual(['filled', 'empty'])
      })
    })
  })

  describe('GIVEN no threshold at all', () => {
    describe('WHEN formatting the thresholds', () => {
      it('THEN should return an empty list', () => {
        expect(sortAndFormatThresholds([], CurrencyEnum.Usd, false)).toEqual([])
      })
    })
  })
})
