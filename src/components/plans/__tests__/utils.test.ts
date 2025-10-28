import {
  returnFirstDefinedArrayRatesSumAsString,
  transformFilterObjectToString,
} from '~/components/plans/utils'
import { ALL_FILTER_VALUES } from '~/core/constants/form'

describe('utils', () => {
  describe('transformFilterObjectToString', () => {
    it('should return a string with the filter object keys and no values', () => {
      const filter = {
        key: 'key',
      }
      const result = transformFilterObjectToString(filter.key)

      expect(result).toBe(`{ "${filter.key}": "${ALL_FILTER_VALUES}" }`)
    })

    it('should return a string with the filter object keys and value', () => {
      const filter = {
        key: 'key',
        value: 'value',
      }
      const result = transformFilterObjectToString(filter.key, filter.value)

      expect(result).toBe(`{ "${filter.key}": "${filter.value}" }`)
    })
  })

  describe('returnFirstDefinedArrayRatesSumAsString', () => {
    describe('when arr1 has items', () => {
      it('should return the sum of arr1 rates as a string with single item', () => {
        const arr1 = [{ rate: 5 }]
        const result = returnFirstDefinedArrayRatesSumAsString(arr1)

        expect(result).toBe('5')
      })

      it('should return the sum of arr1 rates as a string with multiple items', () => {
        const arr1 = [{ rate: 5 }, { rate: 10 }, { rate: 15 }]
        const result = returnFirstDefinedArrayRatesSumAsString(arr1)

        expect(result).toBe('30')
      })

      it('should return the sum of arr1 rates when arr2 also has items', () => {
        const arr1 = [{ rate: 5 }, { rate: 10 }]
        const arr2 = [{ rate: 100 }, { rate: 200 }]
        const result = returnFirstDefinedArrayRatesSumAsString(arr1, arr2)

        expect(result).toBe('15')
      })

      it('should handle decimal rates', () => {
        const arr1 = [{ rate: 5.5 }, { rate: 10.25 }, { rate: 3.75 }]
        const result = returnFirstDefinedArrayRatesSumAsString(arr1)

        expect(result).toBe('19.5')
      })

      it('should handle zero rates', () => {
        const arr1 = [{ rate: 0 }, { rate: 0 }]
        const result = returnFirstDefinedArrayRatesSumAsString(arr1)

        expect(result).toBe('0')
      })

      it('should handle negative rates', () => {
        const arr1 = [{ rate: 10 }, { rate: -5 }]
        const result = returnFirstDefinedArrayRatesSumAsString(arr1)

        expect(result).toBe('5')
      })
    })

    describe('when arr1 is empty', () => {
      it('should return the sum of arr2 rates as a string when arr2 has items', () => {
        const arr1: Array<{ rate: number }> = []
        const arr2 = [{ rate: 20 }, { rate: 30 }]
        const result = returnFirstDefinedArrayRatesSumAsString(arr1, arr2)

        expect(result).toBe('50')
      })

      it('should return undefined when arr2 is also empty', () => {
        const arr1: Array<{ rate: number }> = []
        const arr2: Array<{ rate: number }> = []
        const result = returnFirstDefinedArrayRatesSumAsString(arr1, arr2)

        expect(result).toBeUndefined()
      })

      it('should return undefined when arr2 is not provided', () => {
        const arr1: Array<{ rate: number }> = []
        const result = returnFirstDefinedArrayRatesSumAsString(arr1)

        expect(result).toBeUndefined()
      })

      it('should return undefined when arr2 is explicitly undefined', () => {
        const arr1: Array<{ rate: number }> = []
        const result = returnFirstDefinedArrayRatesSumAsString(arr1, undefined)

        expect(result).toBeUndefined()
      })
    })
  })
})
