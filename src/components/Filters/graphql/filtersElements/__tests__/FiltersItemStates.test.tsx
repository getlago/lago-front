import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemStates } from '~/components/Filters/graphql/filtersElements/FiltersItemStates'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemStates value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemStates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays the combobox', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple selected free-solo states', () => {
    it('THEN displays all state chips', async () => {
      renderComponent('California,New York')

      await waitFor(() => {
        expect(screen.getByText('California')).toBeInTheDocument()
        expect(screen.getByText('New York')).toBeInTheDocument()
      })
    })
  })
})
