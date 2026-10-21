import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemSubscription } from '~/components/Filters/graphql/filtersElements/FiltersItemSubscription'
import { AllTheProviders, TestMocksType } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string, mocks: TestMocksType = []) =>
  render(<FiltersItemSubscription value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })

describe('FiltersItemSubscription', () => {
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

  describe('GIVEN a value stored before the filter was a combobox', () => {
    it('THEN renders the combobox without crashing', async () => {
      renderComponent('sub_ext_1')

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })
})
