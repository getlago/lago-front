import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AggregationTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import CreateBillableMetric, { FILTER_VALUE_WARNING_ALERT_TEST_ID } from '../CreateBillableMetric'

const mockOnSave = jest.fn()
const mockDialogOpen = jest.fn()

let mockHookReturn: Record<string, unknown>

jest.mock('~/hooks/useCreateEditBillableMetric', () => ({
  useCreateEditBillableMetric: () => mockHookReturn,
}))

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen, close: jest.fn() }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ strippedPathname: '/billable-metrics/bm-1/edit', pathname: '/x' }),
}))

// Heavy children unrelated to the tested behavior (code highlighter + drawer using import.meta)
jest.mock('~/components/billableMetrics/BillableMetricCodeSnippet', () => ({
  BillableMetricCodeSnippet: () => null,
}))
jest.mock('~/components/billableMetrics/CustomExpressionDrawer', () => ({
  CustomExpressionDrawer: () => null,
}))

const buildMetric = (overrides = {}) => ({
  id: 'bm-1',
  name: 'My metric',
  code: 'my_metric',
  description: '',
  expression: '',
  aggregationType: AggregationTypeEnum.CountAgg,
  fieldName: undefined,
  recurring: false,
  roundingFunction: undefined,
  roundingPrecision: undefined,
  filters: [{ key: 'model', values: ['name-1', 'name-2'] }],
  hasPlans: true,
  hasSubscriptions: false,
  ...overrides,
})

const setHook = (overrides = {}): void => {
  mockHookReturn = {
    isEdition: true,
    loading: false,
    errorCode: undefined,
    onSave: mockOnSave,
    billableMetric: buildMetric(),
    ...overrides,
  }
}

describe('CreateBillableMetric', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setHook()
  })

  describe('GIVEN a filter-value warning banner', () => {
    describe('WHEN editing a metric attached to plans or subscriptions', () => {
      it('THEN should display the warning banner', () => {
        render(<CreateBillableMetric />)

        expect(screen.getByTestId(FILTER_VALUE_WARNING_ALERT_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN editing a metric that is not in use', () => {
      it('THEN should not display the warning banner', () => {
        setHook({ billableMetric: buildMetric({ hasPlans: false, hasSubscriptions: false }) })

        render(<CreateBillableMetric />)

        expect(screen.queryByTestId(FILTER_VALUE_WARNING_ALERT_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN creating a new metric', () => {
      it('THEN should not display the warning banner', () => {
        setHook({ isEdition: false, billableMetric: undefined })

        render(<CreateBillableMetric />)

        expect(screen.queryByTestId(FILTER_VALUE_WARNING_ALERT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user saves an in-use metric', () => {
    describe('WHEN no filter value was removed', () => {
      it('THEN should submit directly without opening the confirmation dialog', async () => {
        const user = userEvent.setup()

        render(<CreateBillableMetric />)

        // Make the form dirty without touching filters
        const nameInput = screen.getByDisplayValue('My metric')

        await user.type(nameInput, ' updated')
        await user.click(screen.getByTestId('submit'))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledTimes(1)
        })
        expect(mockDialogOpen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a filter value was removed', () => {
      it('THEN should open a danger confirmation dialog instead of submitting', async () => {
        const user = userEvent.setup()

        render(<CreateBillableMetric />)

        // Expand the "model" filter accordion so its value chips mount
        await user.click(screen.getByText('model'))

        const valueChip = await screen.findByText('name-1')
        const deleteButton = valueChip.closest('.MuiChip-root')?.querySelector('button')

        await user.click(deleteButton as HTMLButtonElement)

        // Value is gone from the form before we save
        await waitFor(() => {
          expect(screen.queryByText('name-1')).not.toBeInTheDocument()
        })
        await user.click(screen.getByTestId('submit'))

        await waitFor(() => {
          expect(mockDialogOpen).toHaveBeenCalledWith(
            expect.objectContaining({ colorVariant: 'danger' }),
          )
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })
})
