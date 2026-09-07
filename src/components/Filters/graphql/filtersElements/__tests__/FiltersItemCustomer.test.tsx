import { render, RenderResult, screen, waitFor } from '@testing-library/react'

import { FiltersItemCustomer } from '~/components/Filters/graphql/filtersElements/FiltersItemCustomer'
import { filterDataInlineSeparator } from '~/components/Filters/presentation/types'
import { GetCustomersForFilterItemCustomerDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({
    displayInDialog: false,
  }),
}))

const mockSetFilterValue = jest.fn()

const customersMock: TestMocksType = [
  {
    request: {
      query: GetCustomersForFilterItemCustomerDocument,
      variables: { page: 1, limit: 10 },
    },
    result: {
      data: {
        customers: {
          metadata: { currentPage: 1, totalPages: 1 },
          collection: [
            { id: 'customer-1', externalId: 'ext-1', displayName: 'Acme Corp', deletedAt: null },
          ],
        },
      },
    },
  },
]

const renderComponent = async (
  value?: string,
  mocks: TestMocksType = customersMock,
): Promise<RenderResult> => {
  const result = render(<FiltersItemCustomer value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })

  await screen.findByRole('button')

  return result
}

describe('FiltersItemCustomer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    describe('WHEN the component renders', () => {
      it('THEN displays the combobox', async () => {
        await renderComponent()

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN undefined value', () => {
    describe('WHEN undefined is passed', () => {
      it('THEN should not crash and displays the combobox', async () => {
        await renderComponent(undefined)

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN a value with separator format', () => {
    describe('WHEN value contains external id and name', () => {
      it('THEN renders the combobox without crashing', async () => {
        const value = `ext-1${filterDataInlineSeparator}Acme Corp`

        await renderComponent(value)

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
          expect(screen.getByRole('combobox')).toHaveValue('Acme Corp')
        })
      })
    })
  })
})
