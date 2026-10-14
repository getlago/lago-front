import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { ComboBox } from '../ComboBox'

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
        within(await screen.findByTestId('combobox-item-Create one')).getByRole('option'),
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
      await screen.findByTestId('combobox-item-Create one')
      await userEvent.keyboard('{ArrowDown}{Enter}')

      expect(onAddValue).toHaveBeenCalledTimes(1)
      expect(onChange).not.toHaveBeenCalledWith('unknown')
    })

    it.each([
      [false, false],
      [true, true],
    ])(
      'WHEN some options match AND alwaysVisible is %p THEN the row shows: %p',
      async (alwaysVisible, isShown) => {
        render(
          <ComboBox
            name="rateCard"
            data={[{ value: 'standard-card', label: 'Standard card' }]}
            value=""
            onChange={jest.fn()}
            virtualized={false}
            allowAddValue
            addValueProps={{ label: 'Create one', onClick: jest.fn(), alwaysVisible }}
          />,
        )

        await userEvent.click(screen.getByRole('combobox'))

        expect(await screen.findByText('Standard card')).toBeInTheDocument()
        expect(!!screen.queryByTestId('combobox-item-Create one')).toBe(isShown)
      },
    )
  })
})
