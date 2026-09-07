import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemInvoiceNumber } from '~/components/Filters/graphql/filtersElements/FiltersItemInvoiceNumber'
import { GetInvoiceNumbersForFilterItemInvoiceNumbersDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = async (value?: string): Promise<ReturnType<typeof render>> => {
  const queryResult = jest.fn(() => ({
    data: {
      invoices: {
        metadata: { currentPage: 1, totalPages: 1 },
        collection: [{ id: 'invoice-1', number: 'INV-001' }],
      },
    },
  }))
  const view = render(
    <FiltersItemInvoiceNumber value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: (props) => (
        <AllTheProviders
          {...props}
          mocks={[
            {
              request: {
                query: GetInvoiceNumbersForFilterItemInvoiceNumbersDocument,
                variables: { page: 1, limit: 10 },
              },
              result: queryResult,
            },
          ]}
        />
      ),
    },
  )

  await waitFor(() => expect(queryResult).toHaveBeenCalledTimes(1))

  return view
}

describe('FiltersItemInvoiceNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no initial value', () => {
    it('THEN displays the combobox', async () => {
      await renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN undefined value', () => {
    it('THEN should not crash and displays the combobox', async () => {
      await renderComponent(undefined)

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an initial value', () => {
    it('THEN displays the value in the combobox', async () => {
      await renderComponent('INV-001')

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('INV-001')
      })
    })
  })
})
