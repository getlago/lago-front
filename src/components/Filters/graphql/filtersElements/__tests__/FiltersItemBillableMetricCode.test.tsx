import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemBillableMetricCode } from '~/components/Filters/graphql/filtersElements/FiltersItemBillableMetricCode'
import { BillableMetricsDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const billableMetricsMock: TestMocksType = [
  {
    request: {
      query: BillableMetricsDocument,
      variables: { limit: 100 },
    },
    result: {
      data: {
        billableMetrics: {
          __typename: 'BillableMetricCollection',
          metadata: {
            __typename: 'CollectionMetadata',
            currentPage: 1,
            totalPages: 1,
            totalCount: 1,
          },
          collection: [],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = billableMetricsMock) => {
  return render(
    <FiltersItemBillableMetricCode value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
    },
  )
}

describe('FiltersItemBillableMetricCode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays the combobox', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN undefined value', () => {
    it('THEN should not crash and displays the combobox', async () => {
      renderComponent(undefined)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an initial value', () => {
    it('THEN displays the value in the combobox', async () => {
      renderComponent('bm_code_1')

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('bm_code_1')
      })
    })
  })
})
