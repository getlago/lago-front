import { transformFilterObjectToString } from '../utils'

describe('utils', () => {
  describe('transformFilterObjectToString', () => {
    it('should return a string with the filter object keys and no values', () => {
      const filter = {
        key: 'key',
      }
      const result = transformFilterObjectToString(filter.key)

      expect(result).toBe(`{ "${filter.key}": "__ALL_FILTER_VALUES__" }`)
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
})
