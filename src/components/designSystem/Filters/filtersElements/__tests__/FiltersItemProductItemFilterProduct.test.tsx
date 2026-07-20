import { render, screen, waitFor } from '@testing-library/react'

import { GetProductsForFilterItemProductDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { filterDataInlineSeparator, filterWithoutProductValue } from '../../types'
import { FiltersItemProductItemFilterProduct } from '../FiltersItemProductItemFilterProduct'

jest.mock('~/components/designSystem/Filters/useFilters', () => ({
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
            { id: 'prod-1', code: 'object_storage' },
            { id: 'prod-2', code: 'compute' },
          ],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = productsMock) =>
  render(
    <FiltersItemProductItemFilterProduct value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
    },
  )

describe('FiltersItemProductItemFilterProduct', () => {
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

  describe('GIVEN a value encoded with the product id and code', () => {
    describe('WHEN a single product is selected', () => {
      it('THEN displays the product code chip', async () => {
        const value = `prod-1${filterDataInlineSeparator}object_storage`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('object_storage')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN multiple products are selected', () => {
      it('THEN displays every product code chip', async () => {
        const value = `prod-1${filterDataInlineSeparator}object_storage,prod-2${filterDataInlineSeparator}compute`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('object_storage')).toBeInTheDocument()
          expect(screen.getByText('compute')).toBeInTheDocument()
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
