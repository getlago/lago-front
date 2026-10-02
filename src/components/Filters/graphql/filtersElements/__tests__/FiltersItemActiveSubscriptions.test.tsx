import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'

import { FiltersItemActiveSubscriptions } from '~/components/Filters/graphql/filtersElements/FiltersItemActiveSubscriptions'
import { ActiveSubscriptionsFilterInterval } from '~/components/Filters/presentation/types'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/components/form/ComboBox', () => {
  const actual = jest.requireActual<typeof import('~/components/form/ComboBox')>(
    '~/components/form/ComboBox',
  )

  return {
    ...actual,
    ComboBox: (props: ComponentProps<typeof actual.ComboBox>) => (
      <actual.ComboBox {...props} virtualized={false} />
    ),
  }
})

const renderComponent = (value?: string): { setFilterValue: jest.Mock } => {
  const setFilterValue = jest.fn()

  render(<FiltersItemActiveSubscriptions value={value} setFilterValue={setFilterValue} />, {
    wrapper: AllTheProviders,
  })

  return { setFilterValue }
}

describe('FiltersItemActiveSubscriptions', () => {
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
      it('THEN should display both count inputs with the parsed values', () => {
        const { setFilterValue } = renderComponent(
          `${ActiveSubscriptionsFilterInterval.isBetween},1,5`,
        )

        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]

        expect(inputs).toHaveLength(2)
        expect(inputs[0].value).toBe('1')
        expect(inputs[1].value).toBe('5')
        expect(screen.getByText('and')).toBeInTheDocument()
        expect(setFilterValue).toHaveBeenLastCalledWith(
          `${ActiveSubscriptionsFilterInterval.isBetween},1,5`,
        )
      })
    })

    describe('WHEN the "from" count is changed', () => {
      it('THEN should call setFilterValue with the updated from count', () => {
        const { setFilterValue } = renderComponent(
          `${ActiveSubscriptionsFilterInterval.isBetween},1,5`,
        )

        const [fromInput] = screen.getAllByRole('textbox')

        fireEvent.change(fromInput, { target: { value: '3' } })

        expect(setFilterValue).toHaveBeenLastCalledWith(
          `${ActiveSubscriptionsFilterInterval.isBetween},3,5`,
        )
      })
    })
  })

  describe('GIVEN an "isGreaterThan" value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display only the "from" count input', () => {
        const { setFilterValue } = renderComponent(
          `${ActiveSubscriptionsFilterInterval.isGreaterThan},3,`,
        )

        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]

        expect(inputs).toHaveLength(1)
        expect(inputs[0].value).toBe('3')
        expect(setFilterValue).toHaveBeenLastCalledWith(
          `${ActiveSubscriptionsFilterInterval.isGreaterThan},3,`,
        )
      })
    })
  })

  describe('GIVEN an "isLessThan" value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display only the "to" count input', () => {
        const { setFilterValue } = renderComponent(
          `${ActiveSubscriptionsFilterInterval.isLessThan},,7`,
        )

        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]

        expect(inputs).toHaveLength(1)
        expect(inputs[0].value).toBe('7')
        expect(setFilterValue).toHaveBeenLastCalledWith(
          `${ActiveSubscriptionsFilterInterval.isLessThan},,7`,
        )
      })
    })
  })

  describe('GIVEN the interval combobox', () => {
    describe('WHEN an interval is selected', () => {
      it('THEN should reveal the matching count inputs and emit the new interval', async () => {
        const { setFilterValue } = renderComponent()

        fireEvent.mouseDown(screen.getByRole('combobox'))
        fireEvent.click(await screen.findByText('Is between'))

        expect(screen.getAllByRole('textbox')).toHaveLength(2)
        expect(setFilterValue).toHaveBeenLastCalledWith(
          expect.stringMatching(new RegExp(`^${ActiveSubscriptionsFilterInterval.isBetween},`)),
        )
      })
    })
  })
})
