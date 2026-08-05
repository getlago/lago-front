import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemCustomer } from '~/components/Filters/graphql/filtersElements/FiltersItemCustomer'
import { filterDataInlineSeparator } from '~/components/Filters/presentation/types'
import { AllTheProviders, TestMocksType } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const renderComponent = (value?: string, mocks: TestMocksType = []) => {
  return render(<FiltersItemCustomer value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })
}

describe('FiltersItemCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    describe('WHEN the component renders', () => {
      it('THEN displays the combobox', async () => {
        renderComponent()

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN undefined value', () => {
    describe('WHEN undefined is passed', () => {
      it('THEN should not crash and displays the combobox', async () => {
        renderComponent(undefined)

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN a value with separator format', () => {
    describe('WHEN value contains external id and name', () => {
      it('THEN renders the combobox without crashing', async () => {
        const value = `ext-1${filterDataInlineSeparator}Acme Corp`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })
})
