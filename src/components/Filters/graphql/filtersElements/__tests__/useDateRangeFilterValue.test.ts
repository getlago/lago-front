import { renderHook } from '@testing-library/react'
import { Settings } from 'luxon'

import { useDateRangeFilterValue } from '~/components/Filters/graphql/filtersElements/useDateRangeFilterValue'

const renderUseDateRangeFilterValue = (value?: string) => {
  const setFilterValue = jest.fn()

  const { result } = renderHook(() => useDateRangeFilterValue({ value, setFilterValue }))

  return { result, setFilterValue }
}

describe('useDateRangeFilterValue', () => {
  const originalDefaultZone = Settings.defaultZone

  beforeAll(() => {
    Settings.defaultZone = 'UTC'
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
  })

  describe('GIVEN no value', () => {
    describe('WHEN the hook is called', () => {
      it('THEN should expose empty bounds and no calendar constraint', () => {
        const { result } = renderUseDateRangeFilterValue()

        expect(result.current.from).toBe('')
        expect(result.current.to).toBe('')
        expect(result.current.maxFromDate).toBeUndefined()
        expect(result.current.minToDate).toBeUndefined()
      })
    })
  })

  describe('GIVEN a complete from/to value', () => {
    const value = '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z'

    describe('WHEN the hook is called', () => {
      it('THEN should split the value into both bounds', () => {
        const { result } = renderUseDateRangeFilterValue(value)

        expect(result.current.from).toBe('2024-01-01T00:00:00.000Z')
        expect(result.current.to).toBe('2024-01-31T23:59:59.999Z')
      })

      it('THEN should cap the from calendar at the to date and floor the to calendar at the from date', () => {
        const { result } = renderUseDateRangeFilterValue(value)

        expect(result.current.maxFromDate?.toISO()).toBe('2024-01-31T23:59:59.999Z')
        expect(result.current.minToDate?.toISO()).toBe('2024-01-01T00:00:00.000Z')
      })
    })

    describe('WHEN a from date before the to date is picked', () => {
      it('THEN should keep the to date untouched', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(value)

        result.current.handleFromChange('2024-01-15T09:30:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-01-15T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )
      })
    })

    describe('WHEN a from date after the to date is picked', () => {
      it('THEN should clamp the to date to the end of the picked day', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(value)

        result.current.handleFromChange('2024-02-15T09:30:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-02-15T00:00:00.000Z,2024-02-15T23:59:59.999Z',
        )
      })
    })

    describe('WHEN a to date after the from date is picked', () => {
      it('THEN should keep the from date untouched', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(value)

        result.current.handleToChange('2024-02-15T09:30:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-01-01T00:00:00.000Z,2024-02-15T23:59:59.999Z',
        )
      })
    })

    describe('WHEN a to date before the from date is picked', () => {
      it('THEN should clamp the from date to the start of the picked day', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(
          '2024-02-15T00:00:00.000Z,2024-02-20T23:59:59.999Z',
        )

        result.current.handleToChange('2024-02-10T09:30:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-02-10T00:00:00.000Z,2024-02-10T23:59:59.999Z',
        )
      })
    })

    describe('WHEN the same day is picked on both bounds', () => {
      it('THEN should keep the range as a single full day', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(
          '2024-02-10T00:00:00.000Z,2024-02-10T23:59:59.999Z',
        )

        result.current.handleFromChange('2024-02-10T00:00:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-02-10T00:00:00.000Z,2024-02-10T23:59:59.999Z',
        )
      })
    })
  })

  describe('GIVEN a value with a single bound', () => {
    describe('WHEN the from date is picked with no to date set', () => {
      it('THEN should write the from bound and leave the to bound empty', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(',')

        result.current.handleFromChange('2024-03-01T00:00:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith('2024-03-01T00:00:00.000Z,')
      })
    })

    describe('WHEN the to date is picked with no from date set', () => {
      it('THEN should write the to bound and leave the from bound empty', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(',')

        result.current.handleToChange('2024-03-01T00:00:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(',2024-03-01T23:59:59.999Z')
      })
    })
  })

  describe('GIVEN a bound is cleared', () => {
    describe('WHEN the from date is emptied', () => {
      it('THEN should write an empty from bound instead of an unparsable date', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(
          '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )

        result.current.handleFromChange(undefined)

        expect(setFilterValue).toHaveBeenCalledWith(',2024-01-31T23:59:59.999Z')
      })
    })

    describe('WHEN the to date is emptied', () => {
      it('THEN should write an empty to bound instead of an unparsable date', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(
          '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )

        result.current.handleToChange(null)

        expect(setFilterValue).toHaveBeenCalledWith('2024-01-01T00:00:00.000Z,')
      })
    })
  })

  describe('GIVEN an unparsable bound, as a hand-edited URL would produce', () => {
    describe('WHEN the hook is called', () => {
      it('THEN should expose no calendar constraint for that bound', () => {
        const { result } = renderUseDateRangeFilterValue('not-a-date,2024-01-31T23:59:59.999Z')

        expect(result.current.minToDate).toBeUndefined()
        expect(result.current.maxFromDate?.toISO()).toBe('2024-01-31T23:59:59.999Z')
      })
    })

    describe('WHEN the opposite bound is picked', () => {
      it('THEN should not clamp against the unparsable bound', () => {
        const { result, setFilterValue } = renderUseDateRangeFilterValue(
          'not-a-date,2024-01-31T23:59:59.999Z',
        )

        result.current.handleToChange('2024-03-01T00:00:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith('not-a-date,2024-03-01T23:59:59.999Z')
      })
    })
  })
})
