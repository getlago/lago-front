import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemBillingEntity } from '~/components/Filters/graphql/filtersElements/FiltersItemBillingEntity'
import { filterDataInlineSeparator } from '~/components/Filters/presentation/types'
import { GetBillingEntitiesDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

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
            {
              __typename: 'BillingEntity',
              id: 'entity-2',
              code: 'entity-code-2',
              name: 'Beta Billing',
            },
          ],
        },
      },
    },
  },
]

const renderComponent = (value?: string, mocks: TestMocksType = billingEntitiesMock) => {
  return render(<FiltersItemBillingEntity value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => <AllTheProviders {...props} mocks={mocks} />,
  })
}

describe('FiltersItemBillingEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN billing entity options from query', () => {
    describe('WHEN the component renders', () => {
      it('THEN displays the combobox', async () => {
        renderComponent()

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN the combobox has a placeholder', () => {
      it('THEN shows the translated placeholder key', async () => {
        renderComponent()

        await waitFor(() => {
          const combobox = screen.getByRole('combobox') as HTMLInputElement

          expect(combobox.placeholder).toBe('text_1743688264122ndlc0cpwtzd')
        })
      })
    })
  })

  describe('GIVEN an initial value with separator format', () => {
    describe('WHEN value contains entity id and name', () => {
      it('THEN displays the entity name as a chip', async () => {
        const value = `entity-1${filterDataInlineSeparator}Acme Billing`

        renderComponent(value)

        await waitFor(() => {
          expect(screen.getByText('Acme Billing')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN no initial value', () => {
    describe('WHEN undefined is passed', () => {
      it('THEN should not crash and displays the combobox', async () => {
        renderComponent(undefined)

        await waitFor(() => {
          expect(screen.getByRole('combobox')).toBeInTheDocument()
        })
      })
    })
  })
})
