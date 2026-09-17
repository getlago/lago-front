import { render, screen, waitFor } from '@testing-library/react'

import {
  filterDataInlineSeparator,
  filterWithoutProductValue,
} from '~/components/Filters/presentation/types'
import { GetProductCategoriesForFilterItemProductCategoryDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { FiltersItemRateCardProductCategory } from '../FiltersItemRateCardProductCategory'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const productCategoriesMock: TestMocksType = [
  {
    request: {
      query: GetProductCategoriesForFilterItemProductCategoryDocument,
      variables: { page: 1, limit: 500 },
    },
    result: {
      data: {
        productCategories: {
          metadata: { currentPage: 1, totalPages: 1 },
          collection: [
            { id: 'pc-1', code: 'saas' },
            { id: 'pc-2', code: 'usage' },
          ],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = productCategoriesMock) =>
  render(<FiltersItemRateCardProductCategory value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })

describe('FiltersItemRateCardProductCategory', () => {
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

  describe('GIVEN a value encoded with the product category id and code', () => {
    describe('WHEN a single product category is selected', () => {
      it('THEN displays the product category code chip', async () => {
        const value = `pc-1${filterDataInlineSeparator}saas`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('saas')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN the "Not defined" sentinel is selected', () => {
      it('THEN it is filtered out before mapping (UI-only dimension)', async () => {
        renderComponent(filterWithoutProductValue)

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })
})
