import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemHttpStatuses } from '~/components/Filters/graphql/filtersElements/FiltersItemHttpStatuses'
import { AllTheProviders } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string) => {
  return render(<FiltersItemHttpStatuses value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: AllTheProviders,
  })
}

describe('FiltersItemHttpStatuses', () => {
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
    it.each([['succeeded'], ['failed']])('THEN displays chip for %s', async (statusValue) => {
      renderComponent(statusValue)

      await waitFor(() => {
        expect(screen.getByText(statusValue)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple values', () => {
    it('THEN displays all chips', async () => {
      renderComponent('succeeded,failed')

      await waitFor(() => {
        expect(screen.getByText('succeeded')).toBeInTheDocument()
        expect(screen.getByText('failed')).toBeInTheDocument()
      })
    })
  })
})
