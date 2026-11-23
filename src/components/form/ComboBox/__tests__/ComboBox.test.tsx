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

  describe('GIVEN a value typed then submitted with Enter', () => {
    const data = [
      { value: 'vat_fr', label: 'VAT FR (20%)' },
      { value: 'vat_de', label: 'VAT DE (19%)', disabled: true },
    ]

    const typeAndSubmit = async (text: string): Promise<void> => {
      const input = screen.getByRole('combobox')

      await userEvent.click(input)
      await userEvent.type(input, text)
      await userEvent.keyboard('{Enter}')
    }

    it.each([
      ['an add action', { label: 'Create one', onClick: jest.fn() }],
      ['no add row', undefined],
    ])(
      'WHEN it is a disabled option value AND the combobox has %s THEN nothing is selected',
      async (_, addValueProps) => {
        const onChange = jest.fn()

        render(
          <ComboBox
            name="tax"
            data={data}
            value=""
            onChange={onChange}
            virtualized={false}
            allowAddValue
            addValueProps={addValueProps}
          />,
        )

        await typeAndSubmit('vat_de')

        expect(onChange).not.toHaveBeenCalled()
      },
    )

    // Regression: the blocked Enter left the option label in the input, and a second Enter sent it as a free value.
    it('WHEN Enter is pressed again after a blocked disabled option THEN nothing is selected', async () => {
      const onChange = jest.fn()

      render(
        <ComboBox
          name="tax"
          data={data}
          value=""
          onChange={onChange}
          virtualized={false}
          allowAddValue
        />,
      )

      await typeAndSubmit('vat_de')
      await userEvent.keyboard('{Enter}')

      expect(onChange).not.toHaveBeenCalled()
    })

    it('WHEN it is an enabled option label THEN that option value is selected', async () => {
      const onChange = jest.fn()

      render(
        <ComboBox
          name="tax"
          data={data}
          value=""
          onChange={onChange}
          virtualized={false}
          allowAddValue
          addValueProps={{ label: 'Create one', onClick: jest.fn() }}
        />,
      )

      await typeAndSubmit('VAT FR (20%)')

      expect(onChange).toHaveBeenCalledWith('vat_fr')
    })

    it('WHEN it is an enabled option value THEN that option is selected', async () => {
      const onChange = jest.fn()

      render(
        <ComboBox
          name="tax"
          data={data}
          value=""
          onChange={onChange}
          virtualized={false}
          allowAddValue
          addValueProps={{ label: 'Create one', onClick: jest.fn() }}
        />,
      )

      await typeAndSubmit('vat_fr')

      expect(onChange).toHaveBeenCalledWith('vat_fr')
    })

    it('WHEN it matches no option AND the add row has an action THEN nothing is selected', async () => {
      const onChange = jest.fn()
      const onAddValue = jest.fn()

      render(
        <ComboBox
          name="tax"
          data={data}
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
      await userEvent.keyboard('{Enter}')

      expect(onChange).not.toHaveBeenCalled()
      expect(onAddValue).not.toHaveBeenCalled()
    })

    it('WHEN it matches no option AND the add row has no action THEN the typed text is selected', async () => {
      const onChange = jest.fn()

      render(
        <ComboBox
          name="tax"
          data={data}
          value=""
          onChange={onChange}
          virtualized={false}
          allowAddValue
          addValueProps={{ label: 'Create one' }}
        />,
      )

      await typeAndSubmit('custom')

      expect(onChange).toHaveBeenCalledWith('custom')
    })
  })

  describe('GIVEN a hidden option', () => {
    it('WHEN the list opens THEN it is left out while still holding the value', async () => {
      render(
        <ComboBox
          name="item"
          data={[
            { value: 'sales', label: 'Sales' },
            { value: 'support', label: 'Support', hidden: true },
          ]}
          value="support"
          onChange={jest.fn()}
          virtualized={false}
        />,
      )

      const input = screen.getByRole('combobox')

      await userEvent.click(input)
      await userEvent.keyboard('{ArrowDown}')

      expect(input).toHaveValue('Support')
      expect(await screen.findByRole('option', { name: /Sales/ })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: /Support/ })).not.toBeInTheDocument()
    })
  })
})
