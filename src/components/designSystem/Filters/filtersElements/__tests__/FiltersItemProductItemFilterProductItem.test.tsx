import { render, screen, waitFor } from '@testing-library/react'

import { GetProductItemsForFilterItemProductItemDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { filterDataInlineSeparator, filterWithoutProductItemValue } from '../../types'
import { FiltersItemProductItemFilterProductItem } from '../FiltersItemProductItemFilterProductItem'

jest.mock('~/components/designSystem/Filters/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const productItemsMock: TestMocksType = [
  {
    request: {
      query: GetProductItemsForFilterItemProductItemDocument,
      variables: { page: 1, limit: 500 },
    },
    result: {
      data: {
        productItems: {
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

const renderComponent = (value?: string, mocks: TestMocksType = productItemsMock) =>
  render(
    <FiltersItemProductItemFilterProductItem value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
    },
  )

describe('FiltersItemProductItemFilterProductItem', () => {
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

  describe('GIVEN a value encoded with the product item id and name', () => {
    describe('WHEN a single product item is selected', () => {
      it('THEN displays the product item name chip', async () => {
        const value = `pi-1${filterDataInlineSeparator}Seats`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('Seats')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN multiple product items are selected', () => {
      it('THEN displays every product item name chip', async () => {
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
        renderComponent(filterWithoutProductItemValue)

        await waitFor(() => {
          expect(screen.getByText('Not defined')).toBeInTheDocument()
        })
      })
    })
  })
})
