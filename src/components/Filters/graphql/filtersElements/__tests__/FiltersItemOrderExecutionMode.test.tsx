import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemOrderExecutionMode } from '~/components/Filters/graphql/filtersElements/FiltersItemOrderExecutionMode'
import { OrderExecutionModeEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(
    <FiltersItemOrderExecutionMode value={value} setFilterValue={mockSetFilterValue} />,
    { wrapper: AllTheProviders },
  )
}

describe('FiltersItemOrderExecutionMode', () => {
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

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      const multipleValues = `${OrderExecutionModeEnum.ExecuteInLago},${OrderExecutionModeEnum.OrderOnly}`

      renderComponent(multipleValues)

      await waitFor(() => {
        expect(screen.getByText(OrderExecutionModeEnum.ExecuteInLago)).toBeInTheDocument()
        expect(screen.getByText(OrderExecutionModeEnum.OrderOnly)).toBeInTheDocument()
      })
    })
  })
})
