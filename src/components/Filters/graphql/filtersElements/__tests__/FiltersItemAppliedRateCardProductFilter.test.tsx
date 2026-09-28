import { render, screen, waitFor } from '@testing-library/react'

import {
  filterDataInlineSeparator,
  filterWithoutProductFilterValue,
} from '~/components/Filters/presentation/types'
import { GetProductFiltersForFilterItemRateCardProductFilterDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { FiltersItemAppliedRateCardProductFilter } from '../FiltersItemAppliedRateCardProductFilter'

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
  render(
    <FiltersItemAppliedRateCardProductFilter value={value} setFilterValue={mockSetFilterValue} />,
    { wrapper: (props) => <AllTheProviders {...props} mocks={mocks} /> },
  )

describe('FiltersItemAppliedRateCardProductFilter', () => {
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
  })

  describe('GIVEN the "not defined" sentinel value', () => {
    describe('WHEN it is the selected value', () => {
      it('THEN displays the "Not defined" chip', async () => {
        renderComponent(filterWithoutProductFilterValue)

        await waitFor(() => {
          expect(screen.getByText('Not defined')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN "Not defined" and a real product filter selected together', () => {
    describe('WHEN the component renders', () => {
      it('THEN displays both chips', async () => {
        const value = `${filterWithoutProductFilterValue},pf-1${filterDataInlineSeparator}EU`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('Not defined')).toBeInTheDocument()
          expect(screen.getByText('EU')).toBeInTheDocument()
        })
      })
    })
  })
})
