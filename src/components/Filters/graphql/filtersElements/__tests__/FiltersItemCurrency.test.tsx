import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCurrency } from '~/components/Filters/graphql/filtersElements/FiltersItemCurrency'
import { CurrencyEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemCurrency value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemCurrency', () => {
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

  describe('GIVEN a selected currency value', () => {
    it('THEN displays the selected currency in the input', async () => {
      renderComponent(CurrencyEnum.Usd)

      await waitFor(() => {
        const combobox = screen.getByRole('combobox') as HTMLInputElement

        expect(combobox.value).toBe(CurrencyEnum.Usd)
      })
    })
  })
})
