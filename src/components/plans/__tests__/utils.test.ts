import { ALL_FILTER_VALUES } from '~/core/constants/form'

import { transformFilterObjectToString } from '../utils'

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
})
