import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { FiltersItemSubscription } from '~/components/Filters/graphql/filtersElements/FiltersItemSubscription'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemSubscription value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemSubscription', () => {
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
      renderComponent('sub_123')

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('sub_123')
      })
    })
  })

  describe('WHEN the user types a value', () => {
    it('THEN calls setFilterValue with the typed value', async () => {
      renderComponent()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'sub_123' } })

      await waitFor(() => {
        expect(mockSetFilterValue).toHaveBeenCalledWith('sub_123')
      })
    })
  })
})
