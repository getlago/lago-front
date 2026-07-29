import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { FiltersItemResourceIds } from '~/components/Filters/graphql/filtersElements/FiltersItemResourceIds'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemResourceIds value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemResourceIds', () => {
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
      renderComponent('resource_123')

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('resource_123')
      })
    })
  })

  describe('WHEN the user types a value', () => {
    it('THEN calls setFilterValue with the typed value', async () => {
      renderComponent()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'resource_123' } })

      await waitFor(() => {
        expect(mockSetFilterValue).toHaveBeenCalledWith('resource_123')
      })
    })
  })
})
