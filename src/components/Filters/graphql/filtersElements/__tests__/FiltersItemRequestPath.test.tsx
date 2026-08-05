import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { FiltersItemRequestPath } from '~/components/Filters/graphql/filtersElements/FiltersItemRequestPath'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemRequestPath value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemRequestPath', () => {
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
      renderComponent('/api/v1/invoices')

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('/api/v1/invoices')
      })
    })
  })

  describe('WHEN the user types a value', () => {
    it('THEN calls setFilterValue with the typed value', async () => {
      renderComponent()

      fireEvent.change(screen.getByRole('textbox'), { target: { value: '/api/v1/invoices' } })

      await waitFor(() => {
        expect(mockSetFilterValue).toHaveBeenCalledWith('/api/v1/invoices')
      })
    })
  })
})
