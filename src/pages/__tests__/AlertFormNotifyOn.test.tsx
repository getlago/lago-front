import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  THRESHOLDS_CODE_ERROR_TEST_ID,
  THRESHOLDS_NOTIFY_WHEN_RESOLVED_TEST_ID,
  THRESHOLDS_RECURRING_NOTIFY_WHEN_RESOLVED_TEST_ID,
} from '~/components/alerts/Thresholds'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { AlertTypeEnum, NotifyOnEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import baselineVariables from './fixtures/subscription-alert-update-main.json'

import AlertForm, {
  SUBMIT_SUBSCRIPTION_ALERT_TEST_ID,
  SUBSCRIPTION_ALERT_TYPE_COMBOBOX_TEST_ID,
} from '../AlertForm'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// The combobox list is virtualized, so jsdom renders no option. A native select keeps the
// value, the options, the disabled state and the change wiring real.
jest.mock('~/components/form/ComboBox/ComboBox', () => ({
  ComboBox: ({ data, value, disabled, onChange, 'data-test': dataTest }: ComboBoxProps) => (
    <select
      data-test={dataTest}
      disabled={disabled}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="" />
      {data?.map(({ value: optionValue, label, disabled: optionDisabled }) => (
        <option key={optionValue} value={optionValue} disabled={optionDisabled}>
          {label}
        </option>
      ))}
    </select>
  ),
}))

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: jest.fn() }),
}))

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({ open: jest.fn() }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: { premiumIntegrations: [] } }),
}))

const mockUseGetSubscriptionAlertToEditQuery = jest.fn()
const mockCreateSubscriptionAlert = jest.fn()
const mockUpdateSubscriptionAlert = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSubscriptionInfosQuery: () => ({
    data: {
      subscription: {
        id: 'subscription-1',
        externalId: 'sub-ext-1',
        plan: { id: 'plan-1', amountCurrency: 'USD' },
      },
    },
    loading: false,
  }),
  useGetSubscriptionAlertToEditQuery: (...args: unknown[]) =>
    mockUseGetSubscriptionAlertToEditQuery(...args),
  useGetExistingAlertsOfSubscriptionQuery: () => ({
    data: { subscriptionAlerts: { collection: [] } },
    loading: false,
  }),
  useGetSubscriptionBillableMetricsQuery: () => ({
    data: { billableMetrics: { collection: [] } },
    loading: false,
  }),
  useGetWebhookEndpointsForResolvedAlertsQuery: () => ({
    data: { webhookEndpoints: { collection: [] } },
    loading: false,
  }),
  useCreateSubscriptionAlertMutation: () => [mockCreateSubscriptionAlert],
  useUpdateSubscriptionAlertMutation: () => [mockUpdateSubscriptionAlert],
}))

const TRIGGERED = [NotifyOnEnum.Triggered]
const TRIGGERED_AND_RESOLVED = [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved]

const setParams = (params: Record<string, string>): void => {
  const useParamsMock = jest.requireMock('react-router').useParams as jest.Mock

  useParamsMock.mockReturnValue(params)
}

const row = (index: number): HTMLElement => screen.getByTestId(`row-${index}`)
const valueInput = (index: number): HTMLElement => within(row(index)).getAllByRole('textbox')[0]
const codeInput = (index: number): HTMLElement => within(row(index)).getAllByRole('textbox')[1]
const notifyCell = (index: number): HTMLElement =>
  screen.getAllByTestId(THRESHOLDS_NOTIFY_WHEN_RESOLVED_TEST_ID)[index]
const submitButton = (): HTMLElement => screen.getByTestId(SUBMIT_SUBSCRIPTION_ALERT_TEST_ID)

const fillThreshold = async (
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  value: string,
  code: string,
): Promise<void> => {
  await user.type(valueInput(index), value)
  await user.type(codeInput(index), code)
}

const startCreateForm = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  render(<AlertForm />)

  await user.type(document.querySelector('input[name="code"]') as HTMLInputElement, 'usage_amount')
  await user.selectOptions(
    screen.getByTestId(SUBSCRIPTION_ALERT_TYPE_COMBOBOX_TEST_ID),
    AlertTypeEnum.CurrentUsageAmount,
  )
}

describe('AlertForm with the real thresholds table', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setParams({ subscriptionId: 'subscription-1', customerId: 'customer-1' })
    mockUseGetSubscriptionAlertToEditQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    })
    mockCreateSubscriptionAlert.mockResolvedValue({
      data: { createSubscriptionAlert: { id: 'alert-1' } },
      errors: undefined,
    })
    mockUpdateSubscriptionAlert.mockResolvedValue({
      data: { updateSubscriptionAlert: { id: 'alert-1' } },
      errors: undefined,
    })
  })

  describe('GIVEN a new alert', () => {
    describe('WHEN a threshold is switched to True in its cell', () => {
      it('THEN should send [triggered, resolved] for it and [triggered] for the others', async () => {
        const user = userEvent.setup()

        await startCreateForm(user)
        await fillThreshold(user, 0, '80', 'warn')
        await user.click(screen.getByTestId('add-new-non-recurring-threshold-button'))
        await fillThreshold(user, 1, '100', 'hard')

        expect(notifyCell(0)).toHaveValue('false')

        await user.selectOptions(notifyCell(1), 'true')
        await user.click(submitButton())

        await waitFor(() => {
          expect(mockCreateSubscriptionAlert).toHaveBeenCalledWith({
            variables: {
              input: expect.objectContaining({
                thresholds: [
                  { code: 'warn', recurring: false, value: '8000', notifyOn: TRIGGERED },
                  {
                    code: 'hard',
                    recurring: false,
                    value: '10000',
                    notifyOn: TRIGGERED_AND_RESOLVED,
                  },
                ],
              }),
            },
          })
        })
      })
    })

    describe('WHEN the threshold switched to True has no code', () => {
      it('THEN should flag its code cell and never call the API', async () => {
        const user = userEvent.setup()

        await startCreateForm(user)
        await user.type(valueInput(0), '80')
        await user.selectOptions(notifyCell(0), 'true')

        expect(screen.queryByTestId(THRESHOLDS_CODE_ERROR_TEST_ID)).not.toBeInTheDocument()

        await user.click(submitButton())

        await waitFor(() => {
          expect(submitButton()).toBeDisabled()
          expect(screen.getAllByTestId(THRESHOLDS_CODE_ERROR_TEST_ID).length).toBeGreaterThan(0)
        })
        expect(mockCreateSubscriptionAlert).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the row switched to True is deleted', () => {
      it('THEN should send only the remaining row, at [triggered]', async () => {
        const user = userEvent.setup()

        await startCreateForm(user)
        await fillThreshold(user, 0, '80', 'warn')
        await user.click(screen.getByTestId('add-new-non-recurring-threshold-button'))
        await fillThreshold(user, 1, '100', 'hard')
        await user.selectOptions(notifyCell(1), 'true')
        await user.click(within(row(1)).getByTestId('button'))
        await user.click(submitButton())

        await waitFor(() => {
          expect(mockCreateSubscriptionAlert).toHaveBeenCalledWith({
            variables: {
              input: expect.objectContaining({
                thresholds: [
                  { code: 'warn', recurring: false, value: '8000', notifyOn: TRIGGERED },
                ],
              }),
            },
          })
        })
      })
    })

    describe('WHEN the recurring threshold is turned on', () => {
      it('THEN should show its cell disabled at False, without tooltip', async () => {
        const user = userEvent.setup()

        await startCreateForm(user)
        await user.click(screen.getByTestId('add-new-recurring-threshold-switch'))

        const recurringCell = screen.getByTestId(THRESHOLDS_RECURRING_NOTIFY_WHEN_RESOLVED_TEST_ID)

        await act(async () => {
          fireEvent.mouseOver(recurringCell)
        })

        expect(recurringCell).toBeDisabled()
        expect(recurringCell).toHaveValue('false')
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an alert saved before notifyOn existed', () => {
    beforeEach(() => {
      setParams({
        subscriptionId: 'subscription-1',
        customerId: 'customer-1',
        alertId: 'alert-1',
      })
      mockUseGetSubscriptionAlertToEditQuery.mockReturnValue({
        data: {
          subscriptionAlert: {
            id: 'alert-1',
            alertType: AlertTypeEnum.CurrentUsageAmount,
            billableMetric: null,
            code: 'usage_amount',
            name: 'Usage amount',
            thresholds: [
              { code: 'warn', recurring: false, value: '8000', notifyOn: TRIGGERED },
              { code: 'every', recurring: true, value: '5000', notifyOn: TRIGGERED },
              { code: 'hard', recurring: false, value: '10000', notifyOn: TRIGGERED },
            ],
          },
        },
        loading: false,
        error: undefined,
      })
    })

    describe('WHEN it is saved without any change', () => {
      it('THEN should send today’s payload with [triggered] on every threshold', async () => {
        const user = userEvent.setup()

        render(<AlertForm />)

        await waitFor(() => {
          expect(notifyCell(1)).toHaveValue('false')
        })

        await user.click(submitButton())

        await waitFor(() => {
          expect(mockUpdateSubscriptionAlert).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'alert-1',
                name: 'Usage amount',
                code: 'usage_amount',
                billableMetricId: undefined,
                thresholds: [
                  { code: 'warn', recurring: false, value: '8000', notifyOn: TRIGGERED },
                  { code: 'hard', recurring: false, value: '10000', notifyOn: TRIGGERED },
                  { code: 'every', recurring: true, value: '5000', notifyOn: TRIGGERED },
                ],
              },
            },
          })
        })
        expect(
          JSON.stringify(
            mockUpdateSubscriptionAlert.mock.calls[0][0].variables,
            (key, value: unknown) => (key === 'notifyOn' ? undefined : value),
          ),
        ).toBe(JSON.stringify(baselineVariables))
      })
    })
  })
})
