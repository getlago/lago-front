import { filterDataInlineSeparator } from '../../types'
import { escapeFilterLabel } from '../../utils'
import {
  formatMultiFilterValue,
  parseLabeledMultiFilterValue,
  parseMultiFilterValue,
} from '../utils'

const encodeEntry = (id: string, label: string): string =>
  `${id}${filterDataInlineSeparator}${escapeFilterLabel(label)}`

describe('filtersElements utils', () => {
  describe('parseMultiFilterValue', () => {
    describe('GIVEN a comma-separated string', () => {
      describe('WHEN the string contains multiple values', () => {
        it('THEN should return an array of { value } objects', () => {
          const result = parseMultiFilterValue('a,b,c')

          expect(result).toEqual([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
        })
      })

      describe('WHEN the string contains a single value', () => {
        it('THEN should return an array with one object', () => {
          const result = parseMultiFilterValue('only')

          expect(result).toEqual([{ value: 'only' }])
        })
      })
    })

    describe('GIVEN an empty or nullish input', () => {
      describe('WHEN value is an empty string', () => {
        it('THEN should return an empty array', () => {
          const result = parseMultiFilterValue('')

          expect(result).toEqual([])
        })
      })

      describe('WHEN value is undefined', () => {
        it('THEN should return an empty array', () => {
          const result = parseMultiFilterValue(undefined)

          expect(result).toEqual([])
        })
      })

      describe('WHEN value is not provided', () => {
        it('THEN should return an empty array', () => {
          const result = parseMultiFilterValue()

          expect(result).toEqual([])
        })
      })
    })

    describe('GIVEN a string with empty segments', () => {
      describe('WHEN the string has a trailing comma', () => {
        it('THEN should filter out empty segments', () => {
          const result = parseMultiFilterValue('a,b,')

          expect(result).toEqual([{ value: 'a' }, { value: 'b' }])
        })
      })

      describe('WHEN the string has a leading comma', () => {
        it('THEN should filter out empty segments', () => {
          const result = parseMultiFilterValue(',a,b')

          expect(result).toEqual([{ value: 'a' }, { value: 'b' }])
        })
      })

      describe('WHEN the string is only commas', () => {
        it('THEN should return an empty array', () => {
          const result = parseMultiFilterValue(',,')

          expect(result).toEqual([])
        })
      })
    })
  })

  describe('formatMultiFilterValue', () => {
    describe('GIVEN an array of { value } objects', () => {
      describe('WHEN the array has multiple items', () => {
        it('THEN should join values with commas', () => {
          const result = formatMultiFilterValue([{ value: 'a' }, { value: 'b' }, { value: 'c' }])

          expect(result).toBe('a,b,c')
        })
      })

      describe('WHEN the array has a single item', () => {
        it('THEN should return the value without commas', () => {
          const result = formatMultiFilterValue([{ value: 'only' }])

          expect(result).toBe('only')
        })
      })
    })

    describe('GIVEN an empty array', () => {
      describe('WHEN no items are provided', () => {
        it('THEN should return an empty string', () => {
          const result = formatMultiFilterValue([])

          expect(result).toBe('')
        })
      })
    })
  })

  describe('parseLabeledMultiFilterValue', () => {
    describe('GIVEN encoded `id|separator|label` entries', () => {
      describe('WHEN a single entry is provided', () => {
        it('THEN should decode its label and keep the raw value', () => {
          const value = encodeEntry('prod_1', 'Basic')

          const result = parseLabeledMultiFilterValue({ value })

          expect(result).toEqual([{ label: 'Basic', value }])
        })
      })

      describe('WHEN multiple entries are provided', () => {
        it('THEN should decode every label', () => {
          const first = encodeEntry('prod_1', 'Basic')
          const second = encodeEntry('prod_2', 'Premium')

          const result = parseLabeledMultiFilterValue({ value: `${first},${second}` })

          expect(result).toEqual([
            { label: 'Basic', value: first },
            { label: 'Premium', value: second },
          ])
        })
      })

      describe('WHEN a label contains a comma', () => {
        it('THEN should restore the comma from its placeholder', () => {
          const value = encodeEntry('prod_1', 'Basic, yearly')

          const result = parseLabeledMultiFilterValue({ value })

          expect(result).toEqual([{ label: 'Basic, yearly', value }])
        })
      })

      describe('WHEN an entry has no separator', () => {
        it('THEN should fall back to the raw segment as label', () => {
          const result = parseLabeledMultiFilterValue({ value: 'prod_1' })

          expect(result).toEqual([{ label: 'prod_1', value: 'prod_1' }])
        })
      })
    })

    describe('GIVEN a `withoutValue` sentinel', () => {
      describe('WHEN an entry matches it and a label is provided', () => {
        it('THEN should use `withoutValueLabel` verbatim', () => {
          const entry = encodeEntry('prod_1', 'Basic')

          const result = parseLabeledMultiFilterValue({
            value: `__without__,${entry}`,
            withoutValue: '__without__',
            withoutValueLabel: 'Not defined',
          })

          expect(result).toEqual([
            { label: 'Not defined', value: '__without__' },
            { label: 'Basic', value: entry },
          ])
        })
      })

      describe('WHEN `withoutValueLabel` is omitted', () => {
        it('THEN should decode the sentinel like any other entry', () => {
          const result = parseLabeledMultiFilterValue({
            value: '__without__',
            withoutValue: '__without__',
          })

          expect(result).toEqual([{ label: '__without__', value: '__without__' }])
        })
      })
    })

    describe('GIVEN an empty or nullish input', () => {
      it.each<string | undefined>(['', undefined])(
        'THEN should return an empty array for "%s"',
        (value) => {
          expect(parseLabeledMultiFilterValue({ value })).toEqual([])
        },
      )

      describe('WHEN the string has empty segments', () => {
        it('THEN should filter them out', () => {
          const entry = encodeEntry('prod_1', 'Basic')

          const result = parseLabeledMultiFilterValue({ value: `,${entry},` })

          expect(result).toEqual([{ label: 'Basic', value: entry }])
        })
      })
    })
  })

  describe('roundtrip', () => {
    describe('GIVEN a formatted value', () => {
      describe('WHEN parsed and re-formatted', () => {
        it.each([['a,b,c'], ['single'], ['succeeded,failed,pending'], ['2xx,5xx']])(
          'THEN should produce the original value: "%s"',
          (original) => {
            const parsed = parseMultiFilterValue(original)
            const formatted = formatMultiFilterValue(parsed)

            expect(formatted).toBe(original)
          },
        )
      })
    })
  })
})
