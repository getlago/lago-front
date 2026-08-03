import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { FiltersItemActivityIds } from '~/components/Filters/graphql/filtersElements/FiltersItemActivityIds'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemActivityIds value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemActivityIds', () => {
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
      renderComponent('activity_123')

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('activity_123')
      })
    })
  })

  describe('WHEN the user types a value', () => {
    it('THEN calls setFilterValue with the typed value', async () => {
      renderComponent()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'activity_123' } })

      await waitFor(() => {
        expect(mockSetFilterValue).toHaveBeenCalledWith('activity_123')
      })
    })
  })
})
