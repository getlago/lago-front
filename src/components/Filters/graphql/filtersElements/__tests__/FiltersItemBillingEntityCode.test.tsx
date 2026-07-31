import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemBillingEntityCode } from '~/components/Filters/graphql/filtersElements/FiltersItemBillingEntityCode'
import { GetBillingEntitiesDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const billingEntitiesMock: TestMocksType = [
  {
    request: { query: GetBillingEntitiesDocument },
    result: {
      data: {
        billingEntities: {
          __typename: 'BillingEntityCollection',
          collection: [
            {
              __typename: 'BillingEntity',
              id: 'entity-1',
              code: 'entity-code-1',
              name: 'Acme Billing',
            },
          ],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = billingEntitiesMock) => {
  return render(
    <FiltersItemBillingEntityCode value={value} setFilterValue={mockSetFilterValue} />,
    {
      wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
    },
  )
}

describe('FiltersItemBillingEntityCode', () => {
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
      renderComponent('entity-code-1')

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('entity-code-1')
      })
    })
  })
})
