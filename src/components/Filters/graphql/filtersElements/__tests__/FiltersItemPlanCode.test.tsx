import { render, screen, waitFor } from '@testing-library/react'

import { FiltersItemPlanCode } from '~/components/Filters/graphql/filtersElements/FiltersItemPlanCode'
import { GetPlansForFiltersItemPlanCodeDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

const mockSetFilterValue = jest.fn()

const renderComponent = async (value?: string): Promise<ReturnType<typeof render>> => {
  const queryResult = jest.fn(() => ({
    data: {
      plans: {
        metadata: { currentPage: 1, totalPages: 1 },
        collection: [{ id: 'plan-1', code: 'plan_code_1', deletedAt: null }],
      },
    },
  }))
  const view = render(<FiltersItemPlanCode value={value} setFilterValue={mockSetFilterValue} />, {
    wrapper: (props) => (
      <AllTheProviders
        {...props}
        mocks={[
          {
            request: {
              query: GetPlansForFiltersItemPlanCodeDocument,
              variables: { page: 1, limit: 10 },
            },
            result: queryResult,
          },
        ]}
      />
    ),
  })

  await waitFor(() => expect(queryResult).toHaveBeenCalledTimes(1))

  return view
}

describe('FiltersItemPlanCode', () => {
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
      await renderComponent('plan_code_1')

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveValue('plan_code_1')
      })
    })
  })
})
