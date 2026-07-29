import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCustomerAccountType } from '~/components/Filters/graphql/filtersElements/FiltersItemCustomerAccountType'
import { CustomerAccountTypeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(
    <FiltersItemCustomerAccountType value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: AllTheProviders,
    },
  )
}

describe('FiltersItemCustomerAccountType', () => {
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
      ['customer', CustomerAccountTypeEnum.Customer],
      ['partner', CustomerAccountTypeEnum.Partner],
    ])('THEN renders the combobox for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })
})
