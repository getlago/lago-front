import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemPlanCode } from '~/components/Filters/graphql/filtersElements/FiltersItemPlanCode'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemPlanCode value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemPlanCode', () => {
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

  describe('GIVEN undefined value', () => {
    it('THEN should not crash and displays the combobox', async () => {
      renderComponent(undefined)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an initial value', () => {
    it('THEN displays the value in the combobox', async () => {
      renderComponent('plan_code_1')

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('plan_code_1')
      })
    })
  })
})
