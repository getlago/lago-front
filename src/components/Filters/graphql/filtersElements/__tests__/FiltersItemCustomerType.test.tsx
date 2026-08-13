import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCustomerType } from '~/components/Filters/graphql/filtersElements/FiltersItemCustomerType'
import { CustomerTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemCustomerType value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemCustomerType', () => {
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

  describe('GIVEN a single value', () => {
    it.each([
      ['company', CustomerTypeEnum.Company],
      ['individual', CustomerTypeEnum.Individual],
    ])('THEN renders the combobox for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })
})
