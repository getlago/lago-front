import { buildFiltersPanelValidationSchema } from '~/components/Filters/presentation/filtersPanelPopper/validationSchema'
import { AvailableFiltersEnum, FiltersFormValues } from '~/components/Filters/presentation/types'

const FROM = '2024-01-01T00:00:00.000Z'
const TO = '2024-01-31T23:59:59.999Z'

const isValid = (filters: FiltersFormValues['filters'], hasInitialFilters = false): boolean =>
  buildFiltersPanelValidationSchema(hasInitialFilters).safeParse({ filters }).success

describe('buildFiltersPanelValidationSchema', () => {
  describe('GIVEN a filter row', () => {
    describe('WHEN a required part is missing', () => {
      it.each([
        ['neither a type nor a value', {}],
        ['no type', { value: 'cust-1' }],
        ['no value', { filterType: AvailableFiltersEnum.externalId }],
        ['an empty value', { filterType: AvailableFiltersEnum.externalId, value: '' }],
      ])('THEN it rejects a row with %s', (_, filter) => {
        expect(isValid([filter])).toBe(false)
      })
    })

    describe('WHEN both a type and a value are set', () => {
      it('THEN it accepts the row', () => {
        expect(isValid([{ filterType: AvailableFiltersEnum.externalId, value: 'cust-1' }])).toBe(
          true,
        )
      })
    })

    describe('WHEN one row of several is incomplete', () => {
      it('THEN it rejects the whole set', () => {
        expect(
          isValid([{ filterType: AvailableFiltersEnum.externalId, value: 'cust-1' }, {}]),
        ).toBe(false)
      })
    })
  })

  describe('GIVEN a date range filter', () => {
    it.each([
      ['an ordered range', `${FROM},${TO}`, true],
      ['a single day range', `${FROM},${FROM}`, true],
      ['a reversed range', `${TO},${FROM}`, false],
      ['an unparsable lower bound', `not-a-date,${TO}`, false],
      ['an unparsable upper bound', `${FROM},not-a-date`, false],
      ['a single bound', FROM, false],
    ])('THEN it reports %s (%s) as valid=%s', (_, value, expected) => {
      expect(isValid([{ filterType: AvailableFiltersEnum.issuingDate, value }])).toBe(expected)
    })
  })

  describe('GIVEN a metadata filter', () => {
    it.each([
      ['a single pair', 'key=value', true],
      ['several pairs', 'a=1&b=2', true],
      ['five pairs', 'a=1&b=2&c=3&d=4&e=5', true],
      ['six pairs', 'a=1&b=2&c=3&d=4&e=5&f=6', false],
      ['a pair without separator', 'key', false],
      ['a pair without value', 'key=', false],
      ['a pair without key', '=value', false],
      ['one malformed pair among valid ones', 'a=1&b', false],
    ])('THEN it reports %s (%s) as valid=%s', (_, value, expected) => {
      expect(isValid([{ filterType: AvailableFiltersEnum.metadata, value }])).toBe(expected)
    })
  })

  describe('GIVEN the single row left behind by "Clear all"', () => {
    describe('WHEN filters are currently applied', () => {
      it.each([
        ['an empty row', {}],
        ['a row holding only empty values', { filterType: undefined, value: '' }],
      ])('THEN it accepts %s so the removal can be applied', (_, filter) => {
        expect(isValid([filter], true)).toBe(true)
      })
    })

    describe('WHEN no filter is applied yet', () => {
      it('THEN it rejects it, because there is nothing to remove', () => {
        expect(isValid([{}], false)).toBe(false)
      })
    })

    describe('WHEN a second row was added next to it', () => {
      it('THEN it rejects the set, because the added row is incomplete', () => {
        expect(isValid([{}, {}], true)).toBe(false)
      })
    })

    describe('WHEN a type was picked on it', () => {
      it('THEN it rejects the row, because its value is still missing', () => {
        expect(isValid([{ filterType: AvailableFiltersEnum.externalId }], true)).toBe(false)
      })
    })
  })

  describe('GIVEN a static filter row coming from the URL', () => {
    describe('WHEN it carries its type and value', () => {
      it('THEN it accepts it alongside its disabled flag', () => {
        expect(
          isValid(
            [{ filterType: AvailableFiltersEnum.externalId, value: 'cust-1', disabled: true }],
            true,
          ),
        ).toBe(true)
      })
    })
  })
})
