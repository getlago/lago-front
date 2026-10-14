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
        within(await screen.findByTestId('combobox-item-Create one')).getByText('Create one'),
      )

      expect(onAddValue).toHaveBeenCalledTimes(1)
      expect(onChange).not.toHaveBeenCalledWith('unknown')
    })
  })
})
