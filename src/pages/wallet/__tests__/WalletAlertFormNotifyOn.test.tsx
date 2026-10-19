import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComponentProps } from 'react'

import {
  THRESHOLDS_CODE_ERROR_TEST_ID,
  THRESHOLDS_NOTIFY_WHEN_RESOLVED_TEST_ID,
  THRESHOLDS_RECURRING_NOTIFY_WHEN_RESOLVED_TEST_ID,
} from '~/components/alerts/Thresholds'
import type ComboBoxFieldForTanstack from '~/components/form/ComboBox/ComboBoxFieldForTanstack'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import {
  SUBMIT_WALLET_ALERT_DATA_TEST,
  WALLET_ALERT_TYPE_COMBOBOX_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { AlertTypeEnum, NotifyOnEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import baselineVariables from './fixtures/wallet-alert-update-main.json'

import WalletAlertForm from '../WalletAlertForm'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { id: 'org-1', defaultCurrency: 'USD' },
  }),
}))

// The combobox list is virtualized, so jsdom renders no option. Native selects keep the
// values, the options, the disabled state and the change wiring real.
jest.mock('~/components/form/ComboBox/ComboBox', () => ({
  ComboBox: ({ data, value, disabled, onChange, 'data-test': dataTest }: ComboBoxProps) => (
    <select
      data-test={dataTest}
      disabled={disabled}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="" />
      {data?.map(({ value: optionValue, label }) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  ),
}))

jest.mock('~/components/form/ComboBox/ComboBoxFieldForTanstack', () => {
  const { useFieldContext } = jest.requireActual<typeof import('~/hooks/forms/formContext')>(
    '~/hooks/forms/formContext',
  )

  return {
    __esModule: true,
    default: function MockComboBoxField({
      data,
      disabled,
      dataTest,
    }: ComponentProps<typeof ComboBoxFieldForTanstack>) {
      const field = useFieldContext<string | undefined>()

      return (
        <select
          data-test={dataTest}
          name={field.name}
          disabled={disabled}
          value={field.state.value ?? ''}
          onChange={(event) => field.handleChange(event.target.value || undefined)}
        >
          <option value="" />
          {data?.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      )
    },
  }
})

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: jest.fn() }),
}))

const mockUseGetWalletAlertToEditQuery = jest.fn()
const mockCreateWalletAlert = jest.fn()
const mockUpdateWalletAlert = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetWalletDetailsQuery: () => ({
    data: { wallet: { id: 'wallet-1', currency: 'USD' } },
    loading: false,
  }),
  useGetWalletAlertsQuery: () => ({
    data: { walletAlerts: { collection: [] } },
    loading: false,
  }),
  useGetWalletAlertToEditQuery: (...args: unknown[]) => mockUseGetWalletAlertToEditQuery(...args),
  useGetWebhookEndpointsForResolvedAlertsQuery: () => ({
    data: { webhookEndpoints: { collection: [] } },
    loading: false,
  }),
  useCreateWalletAlertMutation: () => [mockCreateWalletAlert],
  useUpdateWalletAlertMutation: () => [mockUpdateWalletAlert],
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
const submitButton = (): HTMLElement => screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST)

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
  render(<WalletAlertForm />)

  await user.type(document.querySelector('input[name="code"]') as HTMLInputElement, 'credits')
  await user.selectOptions(
    screen.getByTestId(WALLET_ALERT_TYPE_COMBOBOX_DATA_TEST),
    AlertTypeEnum.WalletCreditsBalance,
  )
}

describe('WalletAlertForm with the real thresholds table', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setParams({ walletId: 'wallet-1', customerId: 'customer-1' })
    mockUseGetWalletAlertToEditQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    })
    mockCreateWalletAlert.mockResolvedValue({
      data: { createCustomerWalletAlert: { id: 'alert-1' } },
      errors: undefined,
    })
    mockUpdateWalletAlert.mockResolvedValue({
      data: { updateCustomerWalletAlert: { id: 'alert-1' } },
      errors: undefined,
    })
  })

  describe('GIVEN a new alert', () => {
    describe('WHEN a threshold is switched to True in its cell', () => {
      it('THEN should send [triggered, resolved] for it and [triggered] for the others', async () => {
        const user = userEvent.setup()

        await startCreateForm(user)
        await fillThreshold(user, 0, '8', 'warn')
        await user.click(screen.getByTestId('add-new-non-recurring-threshold-button'))
        await fillThreshold(user, 1, '5', 'critical')

        expect(notifyCell(0)).toHaveValue('false')

        await user.selectOptions(notifyCell(1), 'true')
        await user.click(submitButton())

        await waitFor(() => {
          expect(mockCreateWalletAlert).toHaveBeenCalledWith({
            variables: {
              input: expect.objectContaining({
                thresholds: [
                  { code: 'warn', recurring: false, value: '8', notifyOn: TRIGGERED },
                  {
                    code: 'critical',
                    recurring: false,
                    value: '5',
                    notifyOn: TRIGGERED_AND_RESOLVED,
                  },
                ],
              }),
            },
          })
        })
      })
    })

    describe('WHEN two thresholds share the code of one switched to True', () => {
      it('THEN should flag both code cells and never call the API', async () => {
        const user = userEvent.setup()

        await startCreateForm(user)
        await fillThreshold(user, 0, '8', 'same')
        await user.click(screen.getByTestId('add-new-non-recurring-threshold-button'))
        await fillThreshold(user, 1, '5', 'same')
        await user.selectOptions(notifyCell(1), 'true')

        expect(screen.queryAllByTestId(THRESHOLDS_CODE_ERROR_TEST_ID)).toHaveLength(0)

        await user.click(submitButton())

        await waitFor(() => {
          expect(submitButton()).toBeDisabled()
          expect(screen.getAllByTestId(THRESHOLDS_CODE_ERROR_TEST_ID).length).toBeGreaterThan(0)
        })
        expect(mockCreateWalletAlert).not.toHaveBeenCalled()
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
      setParams({ walletId: 'wallet-1', customerId: 'customer-1', alertId: 'alert-1' })
      mockUseGetWalletAlertToEditQuery.mockReturnValue({
        data: {
          walletAlert: {
            id: 'alert-1',
            walletId: 'wallet-1',
            alertType: AlertTypeEnum.WalletCreditsBalance,
            code: 'credits',
            name: 'Credits',
            thresholds: [
              { code: 'warn', recurring: false, value: '8', notifyOn: TRIGGERED },
              { code: 'critical', recurring: false, value: '5', notifyOn: TRIGGERED },
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

        render(<WalletAlertForm />)

        await waitFor(() => {
          expect(notifyCell(1)).toHaveValue('false')
        })

        await user.click(submitButton())

        await waitFor(() => {
          expect(mockUpdateWalletAlert).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'alert-1',
                name: 'Credits',
                code: 'credits',
                thresholds: [
                  { code: 'warn', recurring: false, value: '8', notifyOn: TRIGGERED },
                  { code: 'critical', recurring: false, value: '5', notifyOn: TRIGGERED },
                ],
              },
            },
          })
        })
        expect(
          JSON.stringify(mockUpdateWalletAlert.mock.calls[0][0].variables, (key, value: unknown) =>
            key === 'notifyOn' ? undefined : value,
          ),
        ).toBe(JSON.stringify(baselineVariables))
      })
    })
  })
})
