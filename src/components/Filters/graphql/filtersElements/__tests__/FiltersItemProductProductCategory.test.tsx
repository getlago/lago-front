import { render, screen, waitFor } from '@testing-library/react'

import {
  filterDataInlineSeparator,
  filterWithoutProductCategoryValue,
} from '~/components/Filters/presentation/types'
import { GetProductCategoriesForFilterItemProductCategoryDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { FiltersItemProductProductCategory } from '../FiltersItemProductProductCategory'

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
            { id: 'prod-1', code: 'object_storage' },
            { id: 'prod-2', code: 'compute' },
          ],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = productCategoriesMock) =>
  render(<FiltersItemProductProductCategory value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })

describe('FiltersItemProductProductCategory', () => {
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

  describe('GIVEN an undefined value', () => {
    describe('WHEN the component renders', () => {
      it('THEN does not crash and displays the combobox', async () => {
        renderComponent(undefined)

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN a value encoded with the productCategory id and code', () => {
    describe('WHEN a single productCategory is selected', () => {
      it('THEN displays the productCategory code chip', async () => {
        const value = `prod-1${filterDataInlineSeparator}object_storage`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('object_storage')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN multiple productCategories are selected', () => {
      it('THEN displays every productCategory code chip', async () => {
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
        renderComponent(filterWithoutProductCategoryValue)

        await waitFor(() => {
          expect(screen.getByText('Not defined')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN a value without the inline separator', () => {
    describe('WHEN it is the selected value', () => {
      it('THEN falls back to displaying the raw id', async () => {
        renderComponent('prod-1')

        await waitFor(() => {
          expect(screen.getByText('prod-1')).toBeInTheDocument()
        })
      })
    })
  })
})
