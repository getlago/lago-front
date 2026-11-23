import { render, screen, waitFor } from '@testing-library/react'
import { ComponentProps } from 'react'

import {
  AvailableFiltersEnum,
  filterDataInlineSeparator,
  filterWithoutProductFilterValue,
  ScopedFilterOption,
} from '~/components/Filters/presentation/types'
import { GetProductFiltersForFilterItemAppliedRateCardProductFilterDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { FiltersItemAppliedRateCardProductFilter } from '../FiltersItemAppliedRateCardProductFilter'

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

const productFiltersMock: TestMocksType = [
  {
    request: {
      query: GetProductFiltersForFilterItemAppliedRateCardProductFilterDocument,
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
  describe('GIVEN options scoped by the surrounding list', () => {
    describe('WHEN the component renders', () => {
      it('THEN offers those options instead of the organization-wide ones', async () => {
        mockUseFilters.mockImplementation(() => ({
          displayInDialog: false,
          optionsByFilter: {
            [AvailableFiltersEnum.appliedRateCardProductFilter]: [
              { id: 'scoped-1', label: 'Europe' },
            ],
          },
        }))

        renderComponent()

        await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())

        expect(mockComboBoxData).toHaveBeenLastCalledWith([
          expect.objectContaining({ value: filterWithoutProductFilterValue }),
          expect.objectContaining({ label: 'Europe' }),
        ])
      })
    })
  })
})
