import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemContractStatus } from '~/components/Filters/graphql/filtersElements/FiltersItemContractStatus'
import { ContractStatusEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemContractStatus value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemContractStatus', () => {
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
      ['active', ContractStatusEnum.Active],
      ['pending', ContractStatusEnum.Pending],
      ['canceled', ContractStatusEnum.Canceled],
      ['terminated', ContractStatusEnum.Terminated],
    ])('THEN displays chip for %s', async (_, enumValue) => {
      renderComponent(enumValue)

      await waitFor(() => {
        expect(screen.getByText(enumValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      renderComponent(`${ContractStatusEnum.Active},${ContractStatusEnum.Terminated}`)

      await waitFor(() => {
        expect(screen.getByText(ContractStatusEnum.Active)).toBeInTheDocument()
        expect(screen.getByText(ContractStatusEnum.Terminated)).toBeInTheDocument()
      })
    })
  })
})
