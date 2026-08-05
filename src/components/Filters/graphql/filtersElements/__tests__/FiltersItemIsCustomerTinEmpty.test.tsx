import { render, screen, waitFor } from '@testing-library/react'

import {
  FiltersItemIsCustomerTinEmpty,
  IsCustomerTinEmptyEnum,
} from '~/components/Filters/graphql/filtersElements/FiltersItemIsCustomerTinEmpty'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(
    <FiltersItemIsCustomerTinEmpty value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: AllTheProviders,
    },
  )
}

describe('FiltersItemIsCustomerTinEmpty', () => {
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

  describe('GIVEN a true value', () => {
    it('THEN renders the combobox', async () => {
      renderComponent(IsCustomerTinEmptyEnum.True)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })
})
