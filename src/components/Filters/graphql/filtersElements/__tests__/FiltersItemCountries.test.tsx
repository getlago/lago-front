import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCountries } from '~/components/Filters/graphql/filtersElements/FiltersItemCountries'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemCountries value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemCountries', () => {
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

  describe('GIVEN multiple selected countries', () => {
    it('THEN displays all country chips', async () => {
      renderComponent('US,FR')

      await waitFor(() => {
        expect(screen.getByText('US')).toBeInTheDocument()
        expect(screen.getByText('FR')).toBeInTheDocument()
      })
    })
  })
})
