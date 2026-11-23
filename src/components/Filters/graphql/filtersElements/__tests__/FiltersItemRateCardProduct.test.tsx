import { render, screen, waitFor } from '@testing-library/react'
import { ComponentProps } from 'react'

import {
  AvailableFiltersEnum,
  filterDataInlineSeparator,
  ScopedFilterOption,
} from '~/components/Filters/presentation/types'
import { GetProductsForFilterItemProductDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { FiltersItemRateCardProduct } from '../FiltersItemRateCardProduct'

type MockedFilters = {
  displayInDialog: boolean
  optionsByFilter?: Partial<Record<AvailableFiltersEnum, ScopedFilterOption[]>>
}

const mockUseFilters = jest.fn<MockedFilters, []>(() => ({ displayInDialog: false }))

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => mockUseFilters(),
}))

const mockComboBoxData = jest.fn<void, [unknown]>()

jest.mock('~/components/form', () => {
  const actual = jest.requireActual<typeof import('~/components/form')>('~/components/form')

  return {
    ...actual,
    MultipleComboBox: (props: ComponentProps<typeof actual.MultipleComboBox>) => {
      mockComboBoxData(props.data)

      return <actual.MultipleComboBox {...props} />
    },
  }
})

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
  render(<FiltersItemRateCardProduct value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })

describe('FiltersItemRateCardProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFilters.mockImplementation(() => ({ displayInDialog: false }))
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

  describe('GIVEN a value encoded with the product id and name', () => {
    describe('WHEN a single product is selected', () => {
      it('THEN displays the product name chip', async () => {
        const value = `pi-1${filterDataInlineSeparator}Seats`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('Seats')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN multiple products are selected', () => {
      it('THEN displays every product name chip', async () => {
        const value = `pi-1${filterDataInlineSeparator}Seats,pi-2${filterDataInlineSeparator}Extra seat`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('Seats')).toBeInTheDocument()
          expect(screen.getByText('Extra seat')).toBeInTheDocument()
        })
      })
    })
  })
  describe('GIVEN options scoped by the surrounding list', () => {
    describe('WHEN the component renders', () => {
      it('THEN offers those options instead of the organization-wide ones', async () => {
        mockUseFilters.mockImplementation(() => ({
          displayInDialog: false,
          optionsByFilter: {
            [AvailableFiltersEnum.rateCardProduct]: [
              { id: 'scoped-1', label: 'Dedicated endpoints' },
            ],
          },
        }))

        renderComponent()

        await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())

        expect(mockComboBoxData).toHaveBeenLastCalledWith([
          expect.objectContaining({ label: 'Dedicated endpoints' }),
        ])
      })
    })
  })
})
