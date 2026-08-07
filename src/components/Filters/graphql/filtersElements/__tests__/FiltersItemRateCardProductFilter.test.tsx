import { render, screen, waitFor } from '@testing-library/react'

import { filterDataInlineSeparator } from '~/components/Filters/presentation/types'
import { GetProductFiltersForFilterItemRateCardProductFilterDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { FiltersItemRateCardProductFilter } from '../FiltersItemRateCardProductFilter'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const productFiltersMock: TestMocksType = [
  {
    request: {
      query: GetProductFiltersForFilterItemRateCardProductFilterDocument,
      variables: { page: 1, limit: 500 },
    },
    result: {
      data: {
        productFilters: {
          metadata: { currentPage: 1, totalPages: 1 },
          collection: [
            { id: 'pf-1', name: 'EU', invoiceDisplayName: null },
            { id: 'pf-2', name: 'US', invoiceDisplayName: 'United States' },
          ],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = productFiltersMock) =>
  render(<FiltersItemRateCardProductFilter value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })

describe('FiltersItemRateCardProductFilter', () => {
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

  describe('GIVEN a value encoded with the product filter id and name', () => {
    describe('WHEN a single product filter is selected', () => {
      it('THEN displays the product filter name chip', async () => {
        const value = `pf-1${filterDataInlineSeparator}EU`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('EU')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN multiple product filters are selected', () => {
      it('THEN displays every product filter name chip', async () => {
        const value = `pf-1${filterDataInlineSeparator}EU,pf-2${filterDataInlineSeparator}United States`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('EU')).toBeInTheDocument()
          expect(screen.getByText('United States')).toBeInTheDocument()
        })
      })
    })
  })
})
