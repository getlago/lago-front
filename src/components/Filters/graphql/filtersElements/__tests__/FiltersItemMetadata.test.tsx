import { act, fireEvent, render, screen } from '@testing-library/react'

import { FiltersItemMetadata } from '~/components/Filters/graphql/filtersElements/FiltersItemMetadata'
import { AllTheProviders } from '~/test-utils'

const renderComponent = async (value?: string): Promise<{ setFilterValue: jest.Mock }> => {
  const setFilterValue = jest.fn()

  await act(async () => {
    render(<FiltersItemMetadata value={value} setFilterValue={setFilterValue} />, {
      wrapper: AllTheProviders,
    })
  })

  return { setFilterValue }
}

describe('FiltersItemMetadata', () => {
  describe('GIVEN no initial value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display a single empty key/value row', async () => {
        const { setFilterValue } = await renderComponent()

        // key + value inputs of a single row
        expect(screen.getAllByRole('textbox')).toHaveLength(2)
        expect(setFilterValue).toHaveBeenCalledWith('=')
      })
    })
  })

  describe('GIVEN a metadata filter value', () => {
    describe('WHEN the component is rendered', () => {
      it('THEN should display one row per key/value pair with the parsed values', async () => {
        const { setFilterValue } = await renderComponent('foo=bar&baz=qux')

        expect(screen.getAllByRole('textbox')).toHaveLength(4)
        expect(screen.getByDisplayValue('foo')).toBeInTheDocument()
        expect(screen.getByDisplayValue('bar')).toBeInTheDocument()
        expect(screen.getByDisplayValue('baz')).toBeInTheDocument()
        expect(screen.getByDisplayValue('qux')).toBeInTheDocument()
        expect(setFilterValue).toHaveBeenLastCalledWith('foo=bar&baz=qux')
      })
    })
  })

  describe('GIVEN a single row', () => {
    describe('WHEN a key is typed', () => {
      it('THEN should call setFilterValue with the formatted metadata', async () => {
        const { setFilterValue } = await renderComponent()

        const [keyInput] = screen.getAllByRole('textbox')

        await act(async () => {
          fireEvent.change(keyInput, { target: { value: 'env' } })
        })

        expect(setFilterValue).toHaveBeenLastCalledWith('env=')
      })
    })
  })

  describe('GIVEN the add metadata button', () => {
    describe('WHEN it is clicked', () => {
      it('THEN should append a new empty key/value row', async () => {
        await renderComponent()

        expect(screen.getAllByRole('textbox')).toHaveLength(2)

        await act(async () => {
          fireEvent.click(screen.getByTestId('add-metadata-button'))
        })

        expect(screen.getAllByRole('textbox')).toHaveLength(4)
      })
    })
  })

  describe('GIVEN multiple rows', () => {
    describe('WHEN a row is deleted', () => {
      it('THEN should remove the corresponding key/value row', async () => {
        await renderComponent('foo=bar&baz=qux')

        expect(screen.getAllByRole('textbox')).toHaveLength(4)

        // The trash buttons are the icon-only buttons rendered before the add button
        const deleteButtons = screen
          .getAllByRole('button')
          .filter((button) => button.querySelector('svg'))

        await act(async () => {
          fireEvent.click(deleteButtons[0])
        })

        expect(screen.getAllByRole('textbox')).toHaveLength(2)
      })
    })
  })
})
