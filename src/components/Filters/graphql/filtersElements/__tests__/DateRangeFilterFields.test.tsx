import { render } from '@testing-library/react'
import { Settings } from 'luxon'

import { DateRangeFilterFields } from '~/components/Filters/graphql/filtersElements/DateRangeFilterFields'
import { DatePickerProps } from '~/components/form'
import { AllTheProviders } from '~/test-utils'

const recordedProps: DatePickerProps[] = []

jest.mock('~/components/form', () => ({
  ...jest.requireActual('~/components/form'),
  DatePicker: (props: DatePickerProps) => {
    recordedProps.push(props)

    return null
  },
}))

const renderComponent = (
  value?: string,
): { fromPicker: DatePickerProps; toPicker: DatePickerProps; setFilterValue: jest.Mock } => {
  const setFilterValue = jest.fn()

  render(<DateRangeFilterFields value={value} setFilterValue={setFilterValue} />, {
    wrapper: AllTheProviders,
  })

  const [fromPicker, toPicker] = recordedProps

  return { fromPicker, toPicker, setFilterValue }
}

describe('DateRangeFilterFields', () => {
  const originalDefaultZone = Settings.defaultZone

  beforeAll(() => {
    Settings.defaultZone = 'UTC'
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
  })

  beforeEach(() => {
    recordedProps.length = 0
  })

  describe('GIVEN no value', () => {
    describe('WHEN the component renders', () => {
      it('THEN should leave both bounds empty and both calendars unconstrained', () => {
        const { fromPicker, toPicker } = renderComponent()

        expect(fromPicker.value).toBe('')
        expect(toPicker.value).toBe('')
        expect(fromPicker.maxDate).toBeUndefined()
        expect(toPicker.minDate).toBeUndefined()
      })
    })
  })

  describe('GIVEN a complete from/to value', () => {
    const value = '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z'

    describe('WHEN the component renders', () => {
      it('THEN should split the value across both pickers', () => {
        const { fromPicker, toPicker } = renderComponent(value)

        expect(fromPicker.value).toBe('2024-01-01T00:00:00.000Z')
        expect(toPicker.value).toBe('2024-01-31T23:59:59.999Z')
      })

      it('THEN should cap the from calendar at the to date and floor the to calendar at the from date', () => {
        const { fromPicker, toPicker } = renderComponent(value)

        expect(fromPicker.maxDate?.toISO()).toBe('2024-01-31T23:59:59.999Z')
        expect(toPicker.minDate?.toISO()).toBe('2024-01-01T00:00:00.000Z')
      })
    })

    describe('WHEN a from date before the to date is picked', () => {
      it('THEN should keep the to date untouched', () => {
        const { fromPicker, setFilterValue } = renderComponent(value)

        fromPicker.onChange('2024-01-15T09:30:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-01-15T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )
      })
    })

    describe('WHEN a from date after the to date is picked', () => {
      it('THEN should clamp the to date to the end of the picked day', () => {
        const { fromPicker, setFilterValue } = renderComponent(value)

        fromPicker.onChange('2024-02-15T09:30:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-02-15T00:00:00.000Z,2024-02-15T23:59:59.999Z',
        )
      })
    })

    describe('WHEN a to date after the from date is picked', () => {
      it('THEN should keep the from date untouched', () => {
        const { toPicker, setFilterValue } = renderComponent(value)

        toPicker.onChange('2024-02-15T09:30:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-01-01T00:00:00.000Z,2024-02-15T23:59:59.999Z',
        )
      })
    })

    describe('WHEN a to date before the from date is picked', () => {
      it('THEN should clamp the from date to the start of the picked day', () => {
        const { toPicker, setFilterValue } = renderComponent(
          '2024-02-15T00:00:00.000Z,2024-02-20T23:59:59.999Z',
        )

        toPicker.onChange('2024-02-10T09:30:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-02-10T00:00:00.000Z,2024-02-10T23:59:59.999Z',
        )
      })
    })

    describe('WHEN the same day is picked on both bounds', () => {
      it('THEN should keep the range as a single full day', () => {
        const { fromPicker, setFilterValue } = renderComponent(
          '2024-02-10T00:00:00.000Z,2024-02-10T23:59:59.999Z',
        )

        fromPicker.onChange('2024-02-10T00:00:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-02-10T00:00:00.000Z,2024-02-10T23:59:59.999Z',
        )
      })
    })
  })

  describe('GIVEN a value with a single bound', () => {
    describe('WHEN the from date is picked with no to date set', () => {
      it('THEN should write the from bound and leave the to bound empty', () => {
        const { fromPicker, setFilterValue } = renderComponent(',')

        fromPicker.onChange('2024-03-01T00:00:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith('2024-03-01T00:00:00.000Z,')
      })
    })

    describe('WHEN the to date is picked with no from date set', () => {
      it('THEN should write the to bound and leave the from bound empty', () => {
        const { toPicker, setFilterValue } = renderComponent(',')

        toPicker.onChange('2024-03-01T00:00:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith(',2024-03-01T23:59:59.999Z')
      })
    })
  })

  describe('GIVEN a bound is cleared', () => {
    const value = '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z'

    describe('WHEN the from date is emptied', () => {
      it('THEN should write an empty from bound instead of an unparsable date', () => {
        const { fromPicker, setFilterValue } = renderComponent(value)

        fromPicker.onChange(undefined)

        expect(setFilterValue).toHaveBeenCalledWith(',2024-01-31T23:59:59.999Z')
      })
    })

    describe('WHEN the to date is emptied', () => {
      it('THEN should write an empty to bound instead of an unparsable date', () => {
        const { toPicker, setFilterValue } = renderComponent(value)

        toPicker.onChange(null)

        expect(setFilterValue).toHaveBeenCalledWith('2024-01-01T00:00:00.000Z,')
      })
    })
  })

  describe('GIVEN an unparsable bound, as a hand-edited URL would produce', () => {
    const value = 'not-a-date,2024-01-31T23:59:59.999Z'

    describe('WHEN the component renders', () => {
      it('THEN should expose no calendar constraint for that bound', () => {
        const { fromPicker, toPicker } = renderComponent(value)

        expect(toPicker.minDate).toBeUndefined()
        expect(fromPicker.maxDate?.toISO()).toBe('2024-01-31T23:59:59.999Z')
      })
    })

    describe('WHEN the opposite bound is picked', () => {
      it('THEN should not clamp against the unparsable bound', () => {
        const { toPicker, setFilterValue } = renderComponent(value)

        toPicker.onChange('2024-03-01T00:00:00.000Z')

        expect(setFilterValue).toHaveBeenCalledWith('not-a-date,2024-03-01T23:59:59.999Z')
      })
    })
  })
})
