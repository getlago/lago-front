import { DesktopDatePickerProps } from '@mui/x-date-pickers/DesktopDatePicker'
import { act, render } from '@testing-library/react'
import { DateTime, Settings } from 'luxon'

import { DatePicker } from '../DatePicker'

const mockRecordedProps: DesktopDatePickerProps<DateTime>[] = []
const mockTranslate = jest.fn((key: string) => `translated_${key}`)

jest.mock('@mui/x-date-pickers/DesktopDatePicker', () => ({
  DesktopDatePicker: (props: DesktopDatePickerProps<DateTime>) => {
    mockRecordedProps.push(props)

    return null
  },
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: mockTranslate,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      id: 'org-1',
      timezone: 'UTC',
    },
  }),
}))

const getPickerProps = (): DesktopDatePickerProps<DateTime> => {
  const props = mockRecordedProps.at(-1)

  if (!props) throw new Error('Date picker props were not recorded')

  return props
}

const changeDate = (date: DateTime | null): void => {
  const onChange = getPickerProps().onChange as ((value: DateTime | null) => void) | undefined

  if (!onChange) throw new Error('Date picker onChange was not recorded')

  act(() => onChange(date))
}

describe('DatePicker', () => {
  const originalDefaultZone = Settings.defaultZone

  beforeEach(() => {
    jest.clearAllMocks()
    mockRecordedProps.length = 0
    Settings.defaultZone = 'UTC'
  })

  afterEach(() => {
    Settings.defaultZone = originalDefaultZone
  })

  describe('GIVEN no minimum date', () => {
    describe('WHEN the component renders', () => {
      it('THEN should default the calendar bound to the minimum supported instant', () => {
        render(<DatePicker onChange={jest.fn()} />)

        expect(getPickerProps().minDate?.toUTC().toISO()).toBe('1970-01-01T00:00:00.000Z')
      })
    })
  })

  describe('GIVEN an explicit minimum date', () => {
    describe('WHEN the component renders', () => {
      it('THEN should preserve the explicit calendar bound', () => {
        render(<DatePicker minDate={DateTime.fromISO('2026-01-01')} onChange={jest.fn()} />)

        expect(getPickerProps().minDate?.toISODate()).toBe('2026-01-01')
      })
    })
  })

  // Regression (ING-634): withholding these left the form on the previously accepted value
  // while the input showed the rejected one. The floor is the consuming schema's rule now.
  describe.each([
    [
      'a year with fewer than four digits',
      DateTime.fromObject({ year: 26, month: 2, day: 9 }),
      '0026-02-09T00:00:00.000Z',
    ],
    [
      'an instant before the minimum supported year',
      DateTime.fromObject({ year: 1969, month: 12, day: 31 }, { zone: 'utc' }),
      '1969-12-31T00:00:00.000Z',
    ],
    [
      'a supported calendar date whose instant is before the minimum',
      DateTime.fromObject({ year: 1970, month: 1, day: 1 }, { zone: 'Asia/Tokyo' }),
      '1969-12-31T15:00:00.000Z',
    ],
    [
      'the minimum supported instant',
      DateTime.fromObject({ year: 1970, month: 1, day: 1 }, { zone: 'utc' }),
      '1970-01-01T00:00:00.000Z',
    ],
    [
      'an instant after the minimum',
      DateTime.fromObject({ year: 2026, month: 9, day: 2 }, { zone: 'utc' }),
      '2026-09-02T00:00:00.000Z',
    ],
  ])('GIVEN %s', (_, date, expectedIso) => {
    describe('WHEN the date changes', () => {
      it('THEN should publish the date and clear the error', () => {
        const onChange = jest.fn()
        const onError = jest.fn()

        render(<DatePicker onChange={onChange} onError={onError} />)
        changeDate(date)

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenCalledWith(expectedIso)
        expect(onError).toHaveBeenCalledWith(undefined)
      })

      it('THEN should not render an error', () => {
        render(<DatePicker onChange={jest.fn()} />)
        changeDate(date)

        expect(getPickerProps().slotProps?.textField).toMatchObject({ error: false })
      })
    })
  })

  describe('GIVEN a date that has no ISO representation', () => {
    describe('WHEN the date changes', () => {
      it('THEN should show an invalid error without publishing the date', () => {
        const onChange = jest.fn()
        const onError = jest.fn()

        render(<DatePicker onChange={onChange} onError={onError} />)
        changeDate(DateTime.fromISO('not-a-date'))

        expect(onChange).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledWith('invalid')
        expect(getPickerProps().slotProps?.textField).toMatchObject({
          error: true,
          helperText: 'translated_text_62cd78ea9bff25e3391b2459',
        })
      })
    })
  })

  describe('GIVEN the minimum supported instant in a timezone behind UTC', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not show an invalid error', () => {
        Settings.defaultZone = 'America/New_York'

        render(<DatePicker value="1970-01-01T00:00:00.000Z" onChange={jest.fn()} />)

        expect(getPickerProps().slotProps?.textField).toMatchObject({ error: false })
      })
    })
  })

  describe('GIVEN a selected date', () => {
    describe('WHEN the date is cleared', () => {
      it('THEN should publish undefined and clear the error', () => {
        const onChange = jest.fn()
        const onError = jest.fn()

        render(
          <DatePicker value="2026-09-02T00:00:00.000Z" onChange={onChange} onError={onError} />,
        )
        changeDate(null)

        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenCalledWith(undefined)
        expect(onError).toHaveBeenCalledWith(undefined)
      })
    })
  })
})
