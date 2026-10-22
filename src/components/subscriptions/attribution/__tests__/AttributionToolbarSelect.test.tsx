import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { AttributionToolbarSelect } from '../AttributionToolbarSelect'

const OPENER_TEST_ID = 'toolbar-select-opener'

const options = [
  { value: 'all', label: 'All' },
  { value: 'tokens', label: 'Tokens' },
  { value: 'storage', label: 'Storage', disabled: true },
]

const renderSelect = (
  props: Partial<Parameters<typeof AttributionToolbarSelect>[0]> = {},
): { onChange: jest.Mock } => {
  const onChange = jest.fn()

  render(
    <AttributionToolbarSelect
      label="Charges"
      value="all"
      options={options}
      onChange={onChange}
      data-test={OPENER_TEST_ID}
      {...props}
    />,
  )

  return { onChange }
}

describe('AttributionToolbarSelect', () => {
  describe('GIVEN a selected value', () => {
    describe('WHEN the select renders', () => {
      it('THEN should display the label of the selected option in the opener', () => {
        renderSelect({ value: 'tokens' })

        expect(screen.getByTestId(OPENER_TEST_ID)).toHaveTextContent('Tokens')
      })
    })
  })

  describe('GIVEN the options are opened', () => {
    describe('WHEN the user picks an option', () => {
      it('THEN should call onChange with its value', async () => {
        const user = userEvent.setup()
        const { onChange } = renderSelect()

        await user.click(screen.getByTestId(OPENER_TEST_ID))
        await user.click(screen.getByRole('button', { name: 'Tokens' }))

        expect(onChange).toHaveBeenCalledWith('tokens')
      })
    })

    describe('WHEN an option is disabled', () => {
      it('THEN should render it disabled', async () => {
        const user = userEvent.setup()

        renderSelect()

        await user.click(screen.getByTestId(OPENER_TEST_ID))

        expect(screen.getByRole('button', { name: 'Storage' })).toBeDisabled()
      })
    })
  })

  describe('GIVEN a searchable select', () => {
    describe('WHEN the user types a search term', () => {
      it('THEN should only list the matching options', async () => {
        const user = userEvent.setup()

        renderSelect({ searchPlaceholder: 'Search a charge' })

        await user.click(screen.getByTestId(OPENER_TEST_ID))
        await user.type(screen.getByPlaceholderText('Search a charge'), 'tok')

        const optionButtons = screen
          .getAllByRole('button')
          .filter((button) => button !== screen.getByTestId(OPENER_TEST_ID))
          .map((button) => button.textContent)

        expect(optionButtons).toContain('Tokens')
        expect(optionButtons).not.toContain('Storage')
        expect(optionButtons).not.toContain('All')
      })
    })
  })

  describe('GIVEN a non-searchable select', () => {
    describe('WHEN the options are opened', () => {
      it('THEN should not render a search input', async () => {
        const user = userEvent.setup()

        renderSelect()

        await user.click(screen.getByTestId(OPENER_TEST_ID))

        expect(within(document.body).queryByRole('textbox')).not.toBeInTheDocument()
      })
    })
  })
})
