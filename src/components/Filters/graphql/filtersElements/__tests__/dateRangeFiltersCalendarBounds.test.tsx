import { render } from '@testing-library/react'
import { Settings } from 'luxon'
import { ComponentType } from 'react'

import { FiltersItemDate } from '~/components/Filters/graphql/filtersElements/FiltersItemDate'
import { FiltersItemIssuingDate } from '~/components/Filters/graphql/filtersElements/FiltersItemIssuingDate'
import { FiltersItemLoggedDate } from '~/components/Filters/graphql/filtersElements/FiltersItemLoggedDate'
import { FiltersItemWebhookDate } from '~/components/Filters/graphql/filtersElements/FiltersItemWebhookDate'
import { FiltersFormValues } from '~/components/Filters/presentation/types'
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

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    timezone: 'TZ_UTC',
  }),
}))

type DateRangeFilterComponent = ComponentType<{
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}>

const DATE_RANGE_FILTERS: [string, DateRangeFilterComponent][] = [
  ['FiltersItemDate', FiltersItemDate],
  ['FiltersItemIssuingDate', FiltersItemIssuingDate],
  ['FiltersItemLoggedDate', FiltersItemLoggedDate],
  ['FiltersItemWebhookDate', FiltersItemWebhookDate],
]

const renderComponent = (
  Component: DateRangeFilterComponent,
  value?: string,
): { fromPicker: DatePickerProps; toPicker: DatePickerProps } => {
  render(<Component value={value} setFilterValue={jest.fn()} />, { wrapper: AllTheProviders })

  const [fromPicker, toPicker] = recordedProps

  return { fromPicker, toPicker }
}

/**
 * Every date range filter must cap its calendars against the opposite bound, so an inverted
 * range cannot be picked in the first place. Covered here for all four of them at once
 * because the wiring is per-component and easy to cross over.
 */
describe('date range filters calendar bounds', () => {
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

  describe('GIVEN both bounds are set', () => {
    describe.each(DATE_RANGE_FILTERS)('WHEN %s renders', (_, Component) => {
      it('THEN should cap the from calendar at the to date', () => {
        const { fromPicker } = renderComponent(
          Component,
          '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )

        expect(fromPicker.maxDate?.toISO()).toBe('2024-01-31T23:59:59.999Z')
        expect(fromPicker.minDate).toBeUndefined()
      })

      it('THEN should floor the to calendar at the from date', () => {
        const { toPicker } = renderComponent(
          Component,
          '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )

        expect(toPicker.minDate?.toISO()).toBe('2024-01-01T00:00:00.000Z')
        expect(toPicker.maxDate).toBeUndefined()
      })
    })
  })

  describe('GIVEN no bound is set', () => {
    describe.each(DATE_RANGE_FILTERS)('WHEN %s renders', (_, Component) => {
      it('THEN should leave both calendars unconstrained', () => {
        const { fromPicker, toPicker } = renderComponent(Component)

        expect(fromPicker.maxDate).toBeUndefined()
        expect(toPicker.minDate).toBeUndefined()
      })
    })
  })
})
