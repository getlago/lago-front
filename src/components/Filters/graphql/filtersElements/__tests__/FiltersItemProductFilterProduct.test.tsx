import { render, screen, waitFor } from '@testing-library/react'

import {
  filterDataInlineSeparator,
  filterWithoutProductValue,
} from '~/components/Filters/presentation/types'
import { GetProductsForFilterItemProductDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { FiltersItemProductFilterProduct } from '../FiltersItemProductFilterProduct'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const productsMock: TestMocksType = [
  {
    request: {
      query: GetProductsForFilterItemProductDocument,
      variables: { page: 1, limit: 500 },
    },
    result: {
      data: {
        products: {
          metadata: { currentPage: 1, totalPages: 1 },
          collection: [
            { id: 'pi-1', name: 'Seats', invoiceDisplayName: null },
            { id: 'pi-2', name: 'Extra', invoiceDisplayName: 'Extra seat' },
          ],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = productsMock) =>
  render(<FiltersItemProductFilterProduct value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })

describe('FiltersItemProductFilterProduct', () => {
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

  describe('GIVEN a value encoded with the productCategory item id and name', () => {
    describe('WHEN a single productCategory item is selected', () => {
      it('THEN displays the productCategory item name chip', async () => {
        const value = `pi-1${filterDataInlineSeparator}Seats`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('Seats')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN multiple productCategory items are selected', () => {
      it('THEN displays every productCategory item name chip', async () => {
        const value = `pi-1${filterDataInlineSeparator}Seats,pi-2${filterDataInlineSeparator}Extra seat`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('Seats')).toBeInTheDocument()
          expect(screen.getByText('Extra seat')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the "not defined" sentinel value', () => {
    describe('WHEN it is the selected value', () => {
      it('THEN displays the "Not defined" chip', async () => {
        renderComponent(filterWithoutProductValue)

        await waitFor(() => {
          expect(screen.getByText('Not defined')).toBeInTheDocument()
        })
      })
    })
  })
})
