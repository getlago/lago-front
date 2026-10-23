import { screen, waitFor, within } from '@testing-library/react'
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

    // Regression: the row from an empty result stayed clickable during the next search's debounce.
    it('WHEN a new term is typed after an empty result THEN the row hides until that term is searched', async () => {
      const searchQuery = jest.fn()
      const props = {
        name: 'rateCard',
        value: '',
        onChange: jest.fn(),
        virtualized: false,
        allowAddValue: true,
        addValueProps: { label: 'Create one', onClick: jest.fn() },
        searchQuery,
      }
      const { rerender } = render(<ComboBox {...props} data={[]} />)
      const input = screen.getByRole('combobox')

      await userEvent.click(input)
      await userEvent.type(input, 'zzz')

      expect(
        await screen.findByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID, undefined, { timeout: 2000 }),
      ).toBeInTheDocument()

      await userEvent.type(input, 'a')

      expect(screen.queryByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)).not.toBeInTheDocument()

      await waitFor(
        () => expect(searchQuery).toHaveBeenLastCalledWith({ variables: { searchTerm: 'zzza' } }),
        { timeout: 2000 },
      )
      rerender(<ComboBox {...props} data={[{ value: 'zzza-card', label: 'Zzza card' }]} />)

      expect(await screen.findByText('Zzza card')).toBeInTheDocument()
      expect(screen.queryByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)).not.toBeInTheDocument()
    })

    // Regression: after a searched selection, a list the parent emptied on its own never showed the row.
    it('WHEN the parent empties the list after a searched selection THEN the row shows', async () => {
      const searchQuery = jest.fn()
      const props = {
        name: 'rateCard',
        onChange: jest.fn(),
        virtualized: false,
        allowAddValue: true,
        addValueProps: { label: 'Create one', onClick: jest.fn() },
        searchQuery,
      }
      const premium = [{ value: 'premium', label: 'Premium card' }]
      const { rerender } = render(<ComboBox {...props} value="" data={premium} />)
      const input = screen.getByRole('combobox')

      await userEvent.click(input)
      await userEvent.type(input, 'prem')
      await waitFor(
        () => expect(searchQuery).toHaveBeenLastCalledWith({ variables: { searchTerm: 'prem' } }),
        { timeout: 2000 },
      )
      await userEvent.click(await screen.findByText('Premium card'))
      rerender(<ComboBox {...props} value="premium" data={premium} />)
      await userEvent.click(document.body)

      rerender(<ComboBox {...props} value="" data={[]} />)
      await userEvent.click(screen.getByRole('combobox'))

      expect(await screen.findByTestId(COMBOBOX_ADD_VALUE_ITEM_TEST_ID)).toBeInTheDocument()
    })
  })
})
