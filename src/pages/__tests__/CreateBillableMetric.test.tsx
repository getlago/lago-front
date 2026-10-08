import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { AggregationTypeEnum, RoundingFunctionEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import CreateBillableMetric from '../CreateBillableMetric'
import {
  BILLABLE_METRIC_ADD_FILTER_TEST_ID,
  BILLABLE_METRIC_ADD_ROUNDING_TEST_ID,
  BILLABLE_METRIC_AGGREGATION_TYPE_TEST_ID,
  BILLABLE_METRIC_CODE_INPUT_TEST_ID,
  BILLABLE_METRIC_FIELD_NAME_INPUT_TEST_ID,
  BILLABLE_METRIC_FILTER_KEY_INPUT_TEST_ID,
  BILLABLE_METRIC_NAME_INPUT_TEST_ID,
  BILLABLE_METRIC_REMOVE_ROUNDING_TEST_ID,
  BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID,
  BILLABLE_METRIC_ROUNDING_PRECISION_TEST_ID,
  BILLABLE_METRIC_SUBMIT_TEST_ID,
  FILTER_VALUE_WARNING_ALERT_TEST_ID,
  getBillableMetricFilterTestId,
} from '../createBillableMetric/billableMetricTestIds'

// jsdom does not implement scrollIntoView (used when the form scrolls to its first error)
Element.prototype.scrollIntoView = jest.fn()

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

jest.mock('~/core/utils/domUtils', () => ({
  ...jest.requireActual('~/core/utils/domUtils'),
  scrollToTop: jest.fn(),
}))

// Heavy children unrelated to the tested behavior (code highlighter + drawer using import.meta)
jest.mock('~/components/billableMetrics/BillableMetricCodeSnippet', () => ({
  BillableMetricCodeSnippet: () => null,
}))
jest.mock('~/components/billableMetrics/customExpressionDrawer/useCustomExpressionDrawer', () => ({
  useCustomExpressionDrawer: () => ({ openDrawer: jest.fn() }),
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

const inputIn = (testId: string): HTMLInputElement =>
  screen.getByTestId(testId).querySelector('input') as HTMLInputElement

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
        const nameInput = inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID)

        await user.type(nameInput, ' updated')
        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

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
        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(mockDialogOpen).toHaveBeenCalledWith(
            expect.objectContaining({ colorVariant: 'danger' }),
          )
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a brand new metric', () => {
    beforeEach(() => {
      setHook({ isEdition: false, billableMetric: undefined })
    })

    describe('WHEN every required field is filled', () => {
      it('THEN should save the derived code, the picked aggregation and a null expression', async () => {
        const user = userEvent.setup()

        render(<CreateBillableMetric />)

        await user.type(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID), 'Api calls')
        await user.click(screen.getByRole('combobox'))

        const options = await screen.findAllByRole('option')

        await user.click(options[0])
        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'Api calls',
              code: 'api_calls',
              aggregationType: AggregationTypeEnum.CountAgg,
              expression: null,
              filters: [],
            }),
          )
        })
      })
    })

    describe('WHEN required fields are still empty', () => {
      it('THEN should not save', async () => {
        const user = userEvent.setup()

        render(<CreateBillableMetric />)

        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID)).toBeDisabled()
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the code is derived from the name', () => {
    describe('WHEN creating a metric', () => {
      it('THEN should fill the code from the typed name', async () => {
        const user = userEvent.setup()

        setHook({ isEdition: false, billableMetric: undefined })
        render(<CreateBillableMetric />)

        await user.type(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID), 'Api calls')

        expect(inputIn(BILLABLE_METRIC_CODE_INPUT_TEST_ID)).toHaveValue('api_calls')
      })
    })

    describe('WHEN editing a metric that already has a code', () => {
      it('THEN should keep the existing code untouched', async () => {
        const user = userEvent.setup()

        setHook({ billableMetric: buildMetric({ hasPlans: false, hasSubscriptions: false }) })
        render(<CreateBillableMetric />)

        await user.type(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID), ' renamed')

        expect(inputIn(BILLABLE_METRIC_CODE_INPUT_TEST_ID)).toHaveValue('my_metric')
      })
    })
  })

  describe('GIVEN an aggregation is switched to one that needs no field', () => {
    describe('WHEN the metric already carries a field name and an expression', () => {
      it('THEN should save neither of them', async () => {
        const user = userEvent.setup()

        setHook({
          billableMetric: buildMetric({
            aggregationType: AggregationTypeEnum.SumAgg,
            fieldName: 'amount',
            expression: 'round(x)',
            filters: [],
            hasPlans: false,
            hasSubscriptions: false,
          }),
        })
        render(<CreateBillableMetric />)

        await user.click(inputIn(BILLABLE_METRIC_AGGREGATION_TYPE_TEST_ID))

        const options = await screen.findAllByRole('option')

        await user.click(options[0])
        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              aggregationType: AggregationTypeEnum.CountAgg,
              fieldName: undefined,
              expression: null,
            }),
          )
        })
      })
    })
  })

  describe('GIVEN an aggregation that aggregates on a field', () => {
    describe('WHEN the field name is emptied', () => {
      it('THEN should not save', async () => {
        const user = userEvent.setup()

        setHook({
          billableMetric: buildMetric({
            aggregationType: AggregationTypeEnum.SumAgg,
            fieldName: 'amount',
            hasPlans: false,
            hasSubscriptions: false,
          }),
        })
        render(<CreateBillableMetric />)

        await user.clear(inputIn(BILLABLE_METRIC_FIELD_NAME_INPUT_TEST_ID))
        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID)).toBeDisabled()
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the rounding section', () => {
    beforeEach(() => {
      setHook({ billableMetric: buildMetric({ hasPlans: false, hasSubscriptions: false }) })
    })

    describe('WHEN no rounding is set', () => {
      it('THEN should offer to add one instead of showing the rounding fields', () => {
        render(<CreateBillableMetric />)

        expect(screen.getByTestId(BILLABLE_METRIC_ADD_ROUNDING_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user adds then removes a rounding', () => {
      it('THEN should reveal the rounding fields and collapse them back', async () => {
        const user = userEvent.setup()

        render(<CreateBillableMetric />)

        await user.click(screen.getByTestId(BILLABLE_METRIC_ADD_ROUNDING_TEST_ID))

        expect(screen.getByTestId(BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID)).toBeInTheDocument()

        await user.click(screen.getByTestId(BILLABLE_METRIC_REMOVE_ROUNDING_TEST_ID))

        expect(screen.getByTestId(BILLABLE_METRIC_ADD_ROUNDING_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a rounding function is already set', () => {
      it('THEN should display the rounding fields right away', () => {
        setHook({
          billableMetric: buildMetric({
            hasPlans: false,
            hasSubscriptions: false,
            roundingFunction: RoundingFunctionEnum.Round,
            roundingPrecision: 2,
          }),
        })

        render(<CreateBillableMetric />)

        expect(screen.getByTestId(BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(BILLABLE_METRIC_ADD_ROUNDING_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the filters section', () => {
    describe('WHEN the user adds a filter', () => {
      it('THEN should append an empty, invalid row that blocks saving', async () => {
        const user = userEvent.setup()

        setHook({ billableMetric: buildMetric({ hasPlans: false, hasSubscriptions: false }) })
        render(<CreateBillableMetric />)

        await user.click(screen.getByTestId(BILLABLE_METRIC_ADD_FILTER_TEST_ID))

        expect(
          screen.getByTestId(
            getBillableMetricFilterTestId(BILLABLE_METRIC_FILTER_KEY_INPUT_TEST_ID, 1),
          ),
        ).toBeInTheDocument()

        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID)).toBeDisabled()
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })

    describe('WHEN two filters share the same key', () => {
      it('THEN should not save', async () => {
        const user = userEvent.setup()

        setHook({
          billableMetric: buildMetric({
            hasPlans: false,
            hasSubscriptions: false,
            filters: [
              { key: 'model', values: ['name-1'] },
              { key: 'model', values: ['name-2'] },
            ],
          }),
        })
        render(<CreateBillableMetric />)

        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID)).toBeDisabled()
        })
        expect(mockOnSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a rounding is configured through the form', () => {
    describe('WHEN a function is picked and a precision of 0 typed', () => {
      it('THEN should save both, keeping the 0', async () => {
        const user = userEvent.setup()

        setHook({
          billableMetric: buildMetric({ hasPlans: false, hasSubscriptions: false, filters: [] }),
        })
        render(<CreateBillableMetric />)

        await user.click(screen.getByTestId(BILLABLE_METRIC_ADD_ROUNDING_TEST_ID))
        await user.click(inputIn(BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID))

        const options = await screen.findAllByRole('option')

        await user.click(options[0])
        await user.type(inputIn(BILLABLE_METRIC_ROUNDING_PRECISION_TEST_ID), '0')
        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              roundingFunction: expect.any(String),
              roundingPrecision: 0,
            }),
          )
        })
      })
    })
  })

  describe('GIVEN a precision left behind by a cleared rounding function', () => {
    describe('WHEN the function is cleared with the combobox and the form submitted', () => {
      // The precision input is hidden once the function is gone, so validating it
      // would disable Save with an error nobody can see.
      it('THEN should save with neither the function nor the precision', async () => {
        const user = userEvent.setup()

        setHook({
          billableMetric: buildMetric({ hasPlans: false, hasSubscriptions: false, filters: [] }),
        })
        render(<CreateBillableMetric />)

        await user.click(screen.getByTestId(BILLABLE_METRIC_ADD_ROUNDING_TEST_ID))
        await user.click(inputIn(BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID))

        const options = await screen.findAllByRole('option')

        await user.click(options[0])
        await user.type(inputIn(BILLABLE_METRIC_ROUNDING_PRECISION_TEST_ID), '-3')

        const clearFunction = screen
          .getByTestId(BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID)
          .querySelector('.MuiAutocomplete-clearIndicator') as HTMLElement

        await user.click(clearFunction)

        expect(
          screen.queryByTestId(BILLABLE_METRIC_ROUNDING_PRECISION_TEST_ID),
        ).not.toBeInTheDocument()

        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              roundingFunction: undefined,
              roundingPrecision: undefined,
            }),
          )
        })
      })
    })
  })

  describe('GIVEN a filter built through the form', () => {
    describe('WHEN a key and two values are entered', () => {
      it('THEN should save the values as bare strings', async () => {
        const user = userEvent.setup()

        setHook({
          billableMetric: buildMetric({ hasPlans: false, hasSubscriptions: false, filters: [] }),
        })
        render(<CreateBillableMetric />)

        await user.click(screen.getByTestId(BILLABLE_METRIC_ADD_FILTER_TEST_ID))
        await user.type(
          inputIn(getBillableMetricFilterTestId(BILLABLE_METRIC_FILTER_KEY_INPUT_TEST_ID, 0)),
          'region',
        )

        // MultipleComboBox takes no data-test; the filter values are the last combobox
        const comboboxes = screen.getAllByRole('combobox')
        const valuesInput = comboboxes[comboboxes.length - 1]

        await user.type(valuesInput, 'eu{enter}')
        await user.type(valuesInput, 'us{enter}')

        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledWith(
            expect.objectContaining({
              filters: [{ key: 'region', values: ['eu', 'us'] }],
            }),
          )
        })
      })
    })
  })

  describe('GIVEN the metric is still being fetched', () => {
    describe('WHEN it arrives after the first render', () => {
      it('THEN should reinitialize the form with the fetched values', async () => {
        setHook({ loading: true, billableMetric: undefined })

        const { rerender } = render(<CreateBillableMetric />)

        expect(screen.queryByTestId(BILLABLE_METRIC_NAME_INPUT_TEST_ID)).not.toBeInTheDocument()

        setHook({ loading: false, billableMetric: buildMetric({ hasPlans: false }) })
        rerender(<CreateBillableMetric />)

        await waitFor(() => {
          expect(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID)).toHaveValue('My metric')
        })
        expect(inputIn(BILLABLE_METRIC_CODE_INPUT_TEST_ID)).toHaveValue('my_metric')
      })
    })

    describe('WHEN it arrives after the fields have mounted empty', () => {
      it('THEN should still reinitialize them', async () => {
        setHook({ loading: false, billableMetric: undefined })

        const { rerender } = render(<CreateBillableMetric />)

        expect(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID)).toHaveValue('')

        setHook({ loading: false, billableMetric: buildMetric({ hasPlans: false }) })
        rerender(<CreateBillableMetric />)

        await waitFor(() => {
          expect(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID)).toHaveValue('My metric')
        })
      })
    })

    describe('WHEN it arrives after the user has started typing', () => {
      // Reinitialising unconditionally (an explicit reset on every data change)
      // would discard what the user typed while the fetch was in flight.
      it('THEN should keep what the user typed', async () => {
        const user = userEvent.setup()

        setHook({ loading: false, billableMetric: undefined })

        const { rerender } = render(<CreateBillableMetric />)

        await user.type(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID), 'typed by user')

        setHook({ loading: false, billableMetric: buildMetric({ hasPlans: false }) })
        rerender(<CreateBillableMetric />)

        await waitFor(() => {
          expect(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID)).toHaveValue('typed by user')
        })
      })
    })
  })

  describe('GIVEN the backend rejected the code as already taken', () => {
    describe('WHEN the error reaches the form after a save attempt', () => {
      it('THEN should flag the code input until it changes, then save again', async () => {
        const user = userEvent.setup()

        setHook({ billableMetric: buildMetric({ hasPlans: false, hasSubscriptions: false }) })

        const { rerender } = render(<CreateBillableMetric />)

        await user.type(inputIn(BILLABLE_METRIC_NAME_INPUT_TEST_ID), ' v2')
        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenCalledTimes(1)
        })

        mockHookReturn = { ...mockHookReturn, errorCode: FORM_ERRORS_ENUM.existingCode }
        rerender(<CreateBillableMetric />)

        await waitFor(() => {
          expect(inputIn(BILLABLE_METRIC_CODE_INPUT_TEST_ID)).toHaveAttribute(
            'aria-invalid',
            'true',
          )
        })

        await user.type(inputIn(BILLABLE_METRIC_CODE_INPUT_TEST_ID), '_v2')

        await waitFor(() => {
          expect(inputIn(BILLABLE_METRIC_CODE_INPUT_TEST_ID)).toHaveAttribute(
            'aria-invalid',
            'false',
          )
        })

        await user.click(screen.getByTestId(BILLABLE_METRIC_SUBMIT_TEST_ID))

        await waitFor(() => {
          expect(mockOnSave).toHaveBeenLastCalledWith(
            expect.objectContaining({ code: 'my_metric_v2' }),
          )
        })
      })
    })
  })
})
