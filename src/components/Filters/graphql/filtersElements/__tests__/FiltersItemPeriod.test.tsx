import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemPeriod } from '~/components/Filters/graphql/filtersElements/FiltersItemPeriod'
import { AnalyticsPeriodScopeEnum } from '~/components/graphs/MonthSelectorDropdown'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemPeriod value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemPeriod', () => {
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
      ['year', AnalyticsPeriodScopeEnum.Year],
      ['quarter', AnalyticsPeriodScopeEnum.Quarter],
      ['month', AnalyticsPeriodScopeEnum.Month],
    ])('THEN renders the combobox for %s', async (_, periodValue) => {
      renderComponent(periodValue)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })
})
