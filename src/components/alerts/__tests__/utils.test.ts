import { patchThreshold, sortAndFormatThresholds } from '~/components/alerts/utils'
import { AlertThreshold, CurrencyEnum, ThresholdInput } from '~/generated/graphql'

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

describe('patchThreshold', () => {
  const baseThreshold: ThresholdInput = { code: 'initial-code', recurring: false, value: '100' }

  describe('GIVEN a code cell', () => {
    describe('WHEN it receives a value', () => {
      it('THEN should store it and leave the other fields untouched', () => {
        expect(patchThreshold(baseThreshold, 'code', 'new-code')).toEqual({
          code: 'new-code',
          recurring: false,
          value: '100',
        })
      })
    })

    describe('WHEN it is emptied', () => {
      it('THEN should store no code rather than the "undefined" string', () => {
        expect(patchThreshold(baseThreshold, 'code', undefined).code).toBeUndefined()
      })
    })
  })

  describe('GIVEN a value cell', () => {
    describe('WHEN it receives a value', () => {
      it('THEN should store it as a string', () => {
        expect(patchThreshold(baseThreshold, 'value', 250).value).toBe('250')
      })
    })

    describe('WHEN it is emptied', () => {
      it('THEN should store an empty string, as the API type requires one', () => {
        expect(patchThreshold(baseThreshold, 'value', undefined).value).toBe('')
      })
    })
  })

  describe('GIVEN the recurring flag', () => {
    describe('WHEN it is toggled', () => {
      it('THEN should store a real boolean', () => {
        expect(patchThreshold(baseThreshold, 'recurring', true).recurring).toBe(true)
      })
    })
  })

  describe('GIVEN any patch', () => {
    describe('WHEN it is applied', () => {
      it('THEN should not mutate the original threshold', () => {
        patchThreshold(baseThreshold, 'value', '999')

        expect(baseThreshold.value).toBe('100')
      })
    })
  })
})
