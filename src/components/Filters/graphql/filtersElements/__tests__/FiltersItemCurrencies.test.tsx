import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCurrencies } from '~/components/Filters/graphql/filtersElements/FiltersItemCurrencies'
import { CurrencyEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemCurrencies value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemCurrencies', () => {
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

  describe('GIVEN multiple selected currencies', () => {
    it('THEN displays all currency chips', async () => {
      renderComponent(`${CurrencyEnum.Usd},${CurrencyEnum.Eur}`)

      await waitFor(() => {
        expect(screen.getByText(CurrencyEnum.Usd)).toBeInTheDocument()
        expect(screen.getByText(CurrencyEnum.Eur)).toBeInTheDocument()
      })
    })
  })
})
