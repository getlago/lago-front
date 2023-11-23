import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME,
} from '~/core/constants/form'
import { CREATE_TAX_ROUTE } from '~/core/router'
import { GetTaxRatesForEditCustomerDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { EditCustomerVatRateDialog } from '../EditCustomerVatRateDialog'

async function prepare({
  mocks = [
    {
      request: {
        query: GetTaxRatesForEditCustomerDocument,
        variables: { limit: 20 },
      },
      result: {
        data: {
          taxes: {
            metadata: {
              currentPage: 1,
              totalPages: 1,
            },
            collection: [],
          },
        },
      },
    },
  ],
}: { mocks?: TestMocksType } = {}) {
  const customer = {
    id: '1234',
    name: 'Customer Name',
    externalId: '4567',
  }

  await act(() =>
    render(<EditCustomerVatRateDialog forceOpen customer={customer} />, {
      mocks,
    }),
  )
}

describe('EditCustomerVatRateDialog', () => {
  afterEach(cleanup)

  it('renders', async () => {
    await prepare()

    expect(screen.queryByTestId('edit-customer-vat-rate-dialog')).toBeInTheDocument()
  })

  it('should propose to create a new tax if none exists', async () => {
    await prepare()

    await waitFor(() =>
      userEvent.click(
        screen
          .queryByTestId('edit-customer-vat-rate-dialog')
          ?.querySelector(
            `.${SEARCH_TAX_INPUT_FOR_CUSTOMER_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
          ) as HTMLElement,
      ),
    )

    expect(screen.queryByTestId('combobox-item-Create a tax_rate')).toBeInTheDocument()
    expect(
      screen.queryByTestId('combobox-item-Create a tax_rate')?.querySelector(`a`),
    ).toHaveAttribute('href', CREATE_TAX_ROUTE)
  })
})
