import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCountry } from '~/components/Filters/graphql/filtersElements/FiltersItemCountry'
import { CountryCodes } from '~/core/constants/countryCodes'
import { CountryCode } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemCountry value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemCountry', () => {
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

  describe('GIVEN a selected country value', () => {
    it('THEN displays the matching country label in the input', async () => {
      renderComponent(CountryCode.Us)

      await waitFor(() => {
        const combobox = screen.getByRole('combobox') as HTMLInputElement

        expect(combobox.value).toBe(CountryCodes[CountryCode.Us])
      })
    })
  })
})
