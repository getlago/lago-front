import { fireEvent, render, screen } from '@testing-library/react'

import { FiltersItemAmount } from '~/components/Filters/graphql/filtersElements/FiltersItemAmount'
import { AmountFilterInterval } from '~/components/Filters/presentation/types'
import { AllTheProviders } from '~/test-utils'

const renderComponent = (value?: string): { setFilterValue: jest.Mock } => {
  const setFilterValue = jest.fn()

  render(<FiltersItemAmount value={value} setFilterValue={setFilterValue} />, {
    wrapper: AllTheProviders,
  })

  return { setFilterValue }
}

describe('FiltersItemAmount', () => {
  describe('GIVEN no initial value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should only display the interval combobox and initialize the filter value', () => {
        const { setFilterValue } = renderComponent()

        expect(screen.getByRole('combobox')).toBeInTheDocument()
        expect(screen.queryAllByRole('textbox')).toHaveLength(0)
        expect(setFilterValue).toHaveBeenCalledWith(',,')
      })
    })
  })

  describe('GIVEN an "isBetween" value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display both amount inputs with the parsed values', () => {
        const { setFilterValue } = renderComponent(`${AmountFilterInterval.isBetween},10,20`)

        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]

        expect(inputs).toHaveLength(2)
        expect(inputs[0].value).toBe('10')
        expect(inputs[1].value).toBe('20')
        expect(screen.getByText('and')).toBeInTheDocument()
        expect(setFilterValue).toHaveBeenLastCalledWith(`${AmountFilterInterval.isBetween},10,20`)
      })
    })

    describe('WHEN the "from" amount is changed', () => {
      it('THEN should call setFilterValue with the updated from amount', () => {
        const { setFilterValue } = renderComponent(`${AmountFilterInterval.isBetween},10,20`)

        const [fromInput] = screen.getAllByRole('textbox')

        fireEvent.change(fromInput, { target: { value: '15' } })

        expect(setFilterValue).toHaveBeenLastCalledWith(`${AmountFilterInterval.isBetween},15,20`)
      })
    })
  })

  describe('GIVEN an "isEqualTo" value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display a single amount input and mirror the value to both bounds', () => {
        const { setFilterValue } = renderComponent(`${AmountFilterInterval.isEqualTo},5,`)

        expect(screen.getAllByRole('textbox')).toHaveLength(1)
        expect(setFilterValue).toHaveBeenLastCalledWith(`${AmountFilterInterval.isEqualTo},5,5`)
      })
    })
  })

  describe('GIVEN an "isUpTo" value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display only the "to" amount input', () => {
        const { setFilterValue } = renderComponent(`${AmountFilterInterval.isUpTo},,20`)

        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]

        expect(inputs).toHaveLength(1)
        expect(inputs[0].value).toBe('20')
        expect(setFilterValue).toHaveBeenLastCalledWith(`${AmountFilterInterval.isUpTo},,20`)
      })
    })
  })

  describe('GIVEN an "isAtLeast" value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display only the "from" amount input', () => {
        const { setFilterValue } = renderComponent(`${AmountFilterInterval.isAtLeast},7,`)

        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]

        expect(inputs).toHaveLength(1)
        expect(inputs[0].value).toBe('7')
        expect(setFilterValue).toHaveBeenLastCalledWith(`${AmountFilterInterval.isAtLeast},7,`)
      })
    })
  })
})
