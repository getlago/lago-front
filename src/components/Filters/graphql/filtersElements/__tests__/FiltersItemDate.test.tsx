import { fireEvent, render, screen } from '@testing-library/react'
import { Settings } from 'luxon'

import { FiltersItemDate } from '~/components/Filters/graphql/filtersElements/FiltersItemDate'
import { AllTheProviders } from '~/test-utils'

const renderComponent = (value?: string): { setFilterValue: jest.Mock } => {
  const setFilterValue = jest.fn()

  render(<FiltersItemDate value={value} setFilterValue={setFilterValue} />, {
    wrapper: AllTheProviders,
  })

  return { setFilterValue }
}

describe('FiltersItemDate', () => {
  const originalDefaultZone = Settings.defaultZone

  beforeAll(() => {
    Settings.defaultZone = 'UTC'
  })

  afterAll(() => {
    Settings.defaultZone = originalDefaultZone
  })

  describe('GIVEN no initial value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display two empty date inputs', () => {
        renderComponent()

        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]

        expect(inputs).toHaveLength(2)
        expect(inputs[0].value).toBe('')
        expect(inputs[1].value).toBe('')
      })
    })
  })

  describe('GIVEN a comma-separated from/to value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display the parsed from and to dates', () => {
        renderComponent('2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z')

        expect(screen.getByDisplayValue('01/01/2024')).toBeInTheDocument()
        expect(screen.getByDisplayValue('01/31/2024')).toBeInTheDocument()
      })
    })

    describe('WHEN the from date is changed', () => {
      it('THEN should call setFilterValue keeping the existing to date', () => {
        const { setFilterValue } = renderComponent(
          '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )

        const [fromInput] = screen.getAllByRole('textbox')

        fireEvent.change(fromInput, { target: { value: '02/15/2024' } })

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-02-15T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )
      })
    })

    describe('WHEN the to date is changed', () => {
      it('THEN should call setFilterValue keeping the existing from date', () => {
        const { setFilterValue } = renderComponent(
          '2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z',
        )

        const toInput = screen.getAllByRole('textbox')[1]

        fireEvent.change(toInput, { target: { value: '02/15/2024' } })

        expect(setFilterValue).toHaveBeenCalledWith(
          '2024-01-01T00:00:00.000Z,2024-02-15T23:59:59.999Z',
        )
      })
    })
  })
})
