import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { ComboBox } from '../ComboBox'
import { COMBOBOX_LOADING_TEST_ID } from '../ComboBoxInput'
import { COMBOBOX_ADD_VALUE_ITEM_TEST_ID } from '../ComboBoxItemWrapper'
import { ComboBoxProps } from '../types'

describe('ComboBox', () => {
  describe('GIVEN an add-value row', () => {
    it('WHEN the row is clicked THEN it runs its action without selecting the typed search', async () => {
      const onChange = jest.fn()
      const onAddValue = jest.fn()

      render(
        <ComboBox
          name="rateCard"
          data={[]}
          value=""
          onChange={onChange}
          virtualized={false}
          allowAddValue
          addValueProps={{ label: 'Create one', onClick: onAddValue }}
        />,
      )

      const input = screen.getByRole('combobox')

      await userEvent.click(input)
      await userEvent.type(input, 'unknown')
      await userEvent.click(
        within(await screen.findByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)).getByRole('option'),
      )

      expect(onAddValue).toHaveBeenCalledTimes(1)
      expect(onChange).not.toHaveBeenCalledWith('unknown')
    })

    it('WHEN the row is picked with the keyboard THEN it runs its action', async () => {
      const onChange = jest.fn()
      const onAddValue = jest.fn()

      render(
        <ComboBox
          name="rateCard"
          data={[]}
          value=""
          onChange={onChange}
          virtualized={false}
          allowAddValue
          addValueProps={{ label: 'Create one', onClick: onAddValue }}
        />,
      )

      const input = screen.getByRole('combobox')

      await userEvent.click(input)
      await userEvent.type(input, 'unknown')
      await screen.findByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)
      await userEvent.keyboard('{ArrowDown}{Enter}')

      expect(onAddValue).toHaveBeenCalledTimes(1)
      expect(onChange).not.toHaveBeenCalledWith('unknown')
    })

    it('WHEN some options match THEN the row is hidden', async () => {
      render(
        <ComboBox
          name="rateCard"
          data={[{ value: 'standard-card', label: 'Standard card' }]}
          value=""
          onChange={jest.fn()}
          virtualized={false}
          allowAddValue
          addValueProps={{ label: 'Create one', onClick: jest.fn() }}
        />,
      )

      await userEvent.click(screen.getByRole('combobox'))

      expect(await screen.findByText('Standard card')).toBeInTheDocument()
      expect(screen.queryByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)).not.toBeInTheDocument()
    })

    it('WHEN a search is in flight THEN the row only shows once it resolves empty', async () => {
      const props: ComboBoxProps = {
        name: 'rateCard',
        data: [],
        value: '',
        onChange: jest.fn(),
        virtualized: false,
        allowAddValue: true,
        addValueProps: { label: 'Create one', onClick: jest.fn() },
        searchQuery: jest.fn(),
      }
      const { rerender } = render(<ComboBox {...props} loading />)

      await userEvent.click(screen.getByRole('combobox'))

      expect(screen.getByTestId(COMBOBOX_LOADING_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)).not.toBeInTheDocument()

      rerender(<ComboBox {...props} loading={false} />)

      expect(await screen.findByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)).toBeInTheDocument()
    })
  })
})
