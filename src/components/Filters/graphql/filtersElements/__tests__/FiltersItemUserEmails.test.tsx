import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { FiltersItemUserEmails } from '~/components/Filters/graphql/filtersElements/FiltersItemUserEmails'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemUserEmails value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemUserEmails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays an empty text input', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('')
      })
    })
  })

  describe('GIVEN an initial value', () => {
    it('THEN displays the value in the text input', async () => {
      renderComponent('alice@example.com')

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('alice@example.com')
      })
    })
  })

  describe('WHEN the user types a value', () => {
    it('THEN calls setFilterValue with the typed value', async () => {
      renderComponent()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'alice@example.com' } })

      await waitFor(() => {
        expect(mockSetFilterValue).toHaveBeenCalledWith('alice@example.com')
      })
    })
  })
})
