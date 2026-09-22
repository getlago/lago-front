import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemContractRateOverrides } from '~/components/Filters/graphql/filtersElements/FiltersItemContractRateOverrides'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(
    <FiltersItemContractRateOverrides value={value} setFilterValue={mockSetFilterValue} />,
    { wrapper: AllTheProviders },
  )
}

describe('FiltersItemContractRateOverrides', () => {
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

  describe.each([
    ['true', 'With rate overrides'],
    ['false', 'Without rate overrides'],
  ])('GIVEN the initial value is %s', (value, label) => {
    it(`THEN displays ${label}`, async () => {
      renderComponent(value)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue(label)
      })
    })
  })
})
