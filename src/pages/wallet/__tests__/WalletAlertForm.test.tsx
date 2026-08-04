import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  CLOSE_WALLET_ALERT_BUTTON_DATA_TEST,
  SUBMIT_WALLET_ALERT_DATA_TEST,
  WALLET_ALERT_FORM_TEST_ID,
  WALLET_ALERT_TYPE_COMBOBOX_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { AlertTypeEnum } from '~/generated/graphql'
import { render, testMockNavigateFn } from '~/test-utils'

import WalletAlertForm, { WALLET_ALERT_FORM_ID } from '../WalletAlertForm'

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

// jsdom has no scrollIntoView, and the scroll target is out of scope here
jest.mock('~/core/form/scrollToFirstInputError', () => ({
  scrollToFirstInputError: jest.fn(),
}))

// The combobox list is virtualized, so jsdom renders no option. Swap the field
// wrapper for a native select: the form wiring, the filtered option list and the
// disabled state stay real, only the MUI popper is out of the picture.
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
    }: {
      data: { value: string; label: string }[]
      disabled?: boolean
      dataTest?: string
    }) {
      const field = useFieldContext<string | undefined>()

      return (
        <select
          data-test={dataTest}
          name={field.name}
          disabled={disabled}
          value={field.state.value ?? ''}
          onChange={(event) =>
            field.handleChange(event.target.value === '' ? undefined : event.target.value)
          }
        >
          <option value="" />
          {data.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      )
    },
  }
})

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

// The thresholds table stays form-library agnostic, so it is stubbed down to
// the two callbacks the form adapter has to honour
const SET_THRESHOLDS_BUTTON = 'mock-set-thresholds'
const SET_THRESHOLD_VALUE_BUTTON = 'mock-set-threshold-value'

jest.mock('~/components/alerts/Thresholds', () => ({
  __esModule: true,
  default: ({
    setThresholds,
    setThresholdValue,
  }: {
    setThresholds: (thresholds: unknown[]) => void
    setThresholdValue: (params: { index: number; key: string; newValue: unknown }) => void
  }) => (
    <div data-test="mock-alert-thresholds">
      <button
        type="button"
        data-test={SET_THRESHOLDS_BUTTON}
        onClick={() => setThresholds([{ code: 'first', recurring: false, value: '10' }])}
      />
      <button
        type="button"
        data-test={SET_THRESHOLD_VALUE_BUTTON}
        onClick={() => setThresholdValue({ index: 0, key: 'value', newValue: '25' })}
      />
    </div>
  ),
  isThresholdValueValid: () => false,
}))

jest.mock('~/styles/mainObjectsForm', () => ({
  FormLoadingSkeleton: ({ id }: { id: string }) => (
    <div data-test={`form-loading-skeleton-${id}`} />
  ),
}))

const mockUseGetWalletDetailsQuery = jest.fn()
const mockUseGetWalletAlertsQuery = jest.fn()
const mockUseGetWalletAlertToEditQuery = jest.fn()
const mockCreateWalletAlert = jest.fn()
const mockUpdateWalletAlert = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetWalletDetailsQuery: (...args: unknown[]) => mockUseGetWalletDetailsQuery(...args),
  useGetWalletAlertsQuery: (...args: unknown[]) => mockUseGetWalletAlertsQuery(...args),
  useGetWalletAlertToEditQuery: (...args: unknown[]) => mockUseGetWalletAlertToEditQuery(...args),
  useCreateWalletAlertMutation: () => [mockCreateWalletAlert],
  useUpdateWalletAlertMutation: () => [mockUpdateWalletAlert],
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
  hasDefinedGQLError: jest.fn(() => false),
}))

const existingAlert = {
  id: 'alert-1',
  walletId: 'wallet-1',
  alertType: AlertTypeEnum.WalletBalanceAmount,
  code: 'my-alert',
  name: 'My alert',
  thresholds: [{ code: 'first', recurring: false, value: '1000' }],
}

const mockLoadedQueries = ({
  alert,
  existingAlertTypes = [],
}: {
  alert?: typeof existingAlert
  existingAlertTypes?: AlertTypeEnum[]
} = {}) => {
  mockUseGetWalletDetailsQuery.mockReturnValue({
    data: { wallet: { id: 'wallet-1', currency: 'USD' } },
    loading: false,
  })
  mockUseGetWalletAlertsQuery.mockReturnValue({
    data: {
      walletAlerts: { collection: existingAlertTypes.map((alertType) => ({ alertType })) },
    },
    loading: false,
  })
  mockUseGetWalletAlertToEditQuery.mockReturnValue({
    data: alert ? { walletAlert: alert } : undefined,
    loading: false,
    error: undefined,
  })
}

const setParams = (params: Record<string, string>) => {
  const useParamsMock = jest.requireMock('react-router-dom').useParams as jest.Mock

  useParamsMock.mockReturnValue(params)
}

const getInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

const getAlertTypeSelect = () =>
  screen.getByTestId(WALLET_ALERT_TYPE_COMBOBOX_DATA_TEST) as HTMLSelectElement

const pickAlertType = async (
  user: ReturnType<typeof userEvent.setup>,
  alertType: AlertTypeEnum,
) => {
  await user.selectOptions(getAlertTypeSelect(), alertType)
}

describe('WalletAlertForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateWalletAlert.mockResolvedValue({
      data: { createCustomerWalletAlert: { id: 'alert-1' } },
      errors: undefined,
    })
    mockUpdateWalletAlert.mockResolvedValue({
      data: { updateCustomerWalletAlert: { id: 'alert-1' } },
      errors: undefined,
    })
    setParams({ walletId: 'wallet-1', customerId: 'customer-1' })
  })

  describe('GIVEN loading state', () => {
    describe('WHEN queries are loading', () => {
      it('THEN should show loading skeleton', () => {
        mockUseGetWalletDetailsQuery.mockReturnValue({ data: undefined, loading: true })
        mockUseGetWalletAlertsQuery.mockReturnValue({ data: undefined, loading: true })
        mockUseGetWalletAlertToEditQuery.mockReturnValue({
          data: undefined,
          loading: false,
          error: undefined,
        })

        render(<WalletAlertForm />)

        expect(screen.getByTestId('form-loading-skeleton-create-wallet-alert')).toBeInTheDocument()
      })

      it('THEN should disable the submit button', () => {
        mockUseGetWalletDetailsQuery.mockReturnValue({ data: undefined, loading: true })
        mockUseGetWalletAlertsQuery.mockReturnValue({ data: undefined, loading: true })
        mockUseGetWalletAlertToEditQuery.mockReturnValue({
          data: undefined,
          loading: false,
          error: undefined,
        })

        render(<WalletAlertForm />)

        expect(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST)).toBeDisabled()
      })
    })
  })

  describe('GIVEN create mode', () => {
    describe('WHEN the form is loaded', () => {
      beforeEach(() => {
        mockLoadedQueries()
      })

      it('THEN should render the form without loading skeleton', () => {
        render(<WalletAlertForm />)

        expect(
          screen.queryByTestId('form-loading-skeleton-create-wallet-alert'),
        ).not.toBeInTheDocument()
      })

      it.each([
        ['form', WALLET_ALERT_FORM_TEST_ID],
        ['alert type combobox', WALLET_ALERT_TYPE_COMBOBOX_DATA_TEST],
        ['submit button', SUBMIT_WALLET_ALERT_DATA_TEST],
        ['close button', CLOSE_WALLET_ALERT_BUTTON_DATA_TEST],
      ])('THEN should display the %s', (_, testId) => {
        render(<WalletAlertForm />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it.each([
        ['name', 'name'],
        ['code', 'code'],
      ])('THEN should display an empty %s input', (_, name) => {
        render(<WalletAlertForm />)

        expect(getInput(name)).toHaveValue('')
      })

      it('THEN should not display the thresholds table until a type is picked', () => {
        render(<WalletAlertForm />)

        expect(screen.queryByTestId('mock-alert-thresholds')).not.toBeInTheDocument()
      })

      it('THEN should offer every wallet alert type', () => {
        render(<WalletAlertForm />)

        expect(getAlertTypeSelect().querySelectorAll('option[value]:not([value=""])')).toHaveLength(
          4,
        )
      })
    })

    describe('WHEN the wallet already has some alert types', () => {
      it('THEN should filter those types out of the combobox', () => {
        mockLoadedQueries({
          existingAlertTypes: [
            AlertTypeEnum.WalletCreditsBalance,
            AlertTypeEnum.WalletBalanceAmount,
          ],
        })
        render(<WalletAlertForm />)

        const remaining = Array.from(
          getAlertTypeSelect().querySelectorAll('option[value]:not([value=""])'),
        ).map((option) => option.getAttribute('value'))

        expect(remaining).toEqual([
          AlertTypeEnum.WalletCreditsOngoingBalance,
          AlertTypeEnum.WalletOngoingBalanceAmount,
        ])
      })
    })

    describe('WHEN typing a name', () => {
      beforeEach(() => {
        mockLoadedQueries()
      })

      it('THEN should derive the code from it', async () => {
        const user = userEvent.setup()

        render(<WalletAlertForm />)

        await user.type(getInput('name'), 'My alert')

        expect(getInput('code')).toHaveValue('my_alert')
      })

      it('THEN should stop deriving it once the code has been edited', async () => {
        const user = userEvent.setup()

        render(<WalletAlertForm />)

        await user.type(getInput('code'), 'custom-code')
        await user.tab()
        await user.type(getInput('name'), 'My alert')

        expect(getInput('code')).toHaveValue('custom-code')
      })
    })

    describe('WHEN submitting a valid form', () => {
      beforeEach(() => {
        mockLoadedQueries()
      })

      it('THEN should create the alert with the serialized thresholds', async () => {
        const user = userEvent.setup()

        render(<WalletAlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.WalletBalanceAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST))

        await waitFor(() => {
          expect(mockCreateWalletAlert).toHaveBeenCalledWith({
            variables: {
              input: {
                walletId: 'wallet-1',
                name: '',
                code: 'my-alert',
                alertType: AlertTypeEnum.WalletBalanceAmount,
                thresholds: [{ code: 'first', recurring: false, value: '1000' }],
              },
            },
          })
        })
      })

      it('THEN should show a success toast and leave the form', async () => {
        const user = userEvent.setup()

        render(<WalletAlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.WalletBalanceAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
        })
        expect(testMockNavigateFn).toHaveBeenCalled()
      })

      it('THEN should send the value patched on a single threshold cell', async () => {
        const user = userEvent.setup()

        render(<WalletAlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.WalletBalanceAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SET_THRESHOLD_VALUE_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST))

        await waitFor(() => {
          expect(mockCreateWalletAlert).toHaveBeenCalledWith(
            expect.objectContaining({
              variables: {
                input: expect.objectContaining({
                  thresholds: [{ code: 'first', recurring: false, value: '2500' }],
                }),
              },
            }),
          )
        })
      })
    })

    describe('WHEN submitting without a required field', () => {
      it('THEN should not call the mutation', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        render(<WalletAlertForm />)

        await user.click(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST))

        await waitFor(() => {
          expect(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST)).toBeDisabled()
        })
        expect(mockCreateWalletAlert).not.toHaveBeenCalled()
      })

      it('THEN should scroll to the first field in error', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        render(<WalletAlertForm />)

        await user.click(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST))

        await waitFor(() => {
          expect(scrollToFirstInputError).toHaveBeenCalledWith(
            WALLET_ALERT_FORM_ID,
            expect.any(Object),
          )
        })
      })
    })

    describe('WHEN the code already exists', () => {
      it('THEN should keep the user on the form', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        mockCreateWalletAlert.mockResolvedValue({
          data: undefined,
          errors: [{ message: 'ValueAlreadyExist' }],
        })
        ;(hasDefinedGQLError as jest.Mock).mockImplementation(
          (code: string) => code === 'ValueAlreadyExist',
        )

        render(<WalletAlertForm />)

        await user.type(getInput('code'), 'my-alert')
        await pickAlertType(user, AlertTypeEnum.WalletBalanceAmount)
        await user.click(screen.getByTestId(SET_THRESHOLDS_BUTTON))
        await user.click(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST))

        await waitFor(() => {
          expect(mockCreateWalletAlert).toHaveBeenCalled()
        })
        expect(testMockNavigateFn).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN edition mode', () => {
    beforeEach(() => {
      setParams({ walletId: 'wallet-1', customerId: 'customer-1', alertId: 'alert-1' })
      mockLoadedQueries({ alert: existingAlert })
    })

    describe('WHEN the form is loaded', () => {
      it.each([
        ['name', 'name', 'My alert'],
        ['code', 'code', 'my-alert'],
      ])('THEN should prefill the %s input', async (_, name, expected) => {
        render(<WalletAlertForm />)

        await waitFor(() => {
          expect(getInput(name)).toHaveValue(expected)
        })
      })

      it('THEN should lock the alert type', () => {
        render(<WalletAlertForm />)

        expect(getAlertTypeSelect()).toBeDisabled()
      })

      it('THEN should display the thresholds table', () => {
        render(<WalletAlertForm />)

        expect(screen.getByTestId('mock-alert-thresholds')).toBeInTheDocument()
      })
    })

    describe('WHEN submitting the form', () => {
      it('THEN should update the alert without the immutable fields', async () => {
        const user = userEvent.setup()

        render(<WalletAlertForm />)

        await waitFor(() => {
          expect(getInput('code')).toHaveValue('my-alert')
        })

        await user.clear(getInput('code'))
        await user.type(getInput('code'), 'renamed-alert')
        await user.click(screen.getByTestId(SUBMIT_WALLET_ALERT_DATA_TEST))

        await waitFor(() => {
          expect(mockUpdateWalletAlert).toHaveBeenCalledWith({
            variables: {
              input: {
                id: 'alert-1',
                name: 'My alert',
                code: 'renamed-alert',
                thresholds: [{ code: 'first', recurring: false, value: '1000' }],
              },
            },
          })
        })
      })
    })

    describe('WHEN the alert has been deleted meanwhile', () => {
      it('THEN should notify the user and redirect without a history entry', async () => {
        mockUseGetWalletAlertToEditQuery.mockReturnValue({
          data: undefined,
          loading: false,
          error: { message: 'NotFound' },
        })
        ;(hasDefinedGQLError as jest.Mock).mockImplementation((code: string) => code === 'NotFound')

        render(<WalletAlertForm />)

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
        })
        expect(testMockNavigateFn).toHaveBeenCalledWith(
          expect.stringContaining('wallet-1'),
          expect.objectContaining({ replace: true }),
        )
      })
    })
  })

  describe('GIVEN a dirty form', () => {
    describe('WHEN closing it', () => {
      it('THEN should ask the user to confirm', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        render(<WalletAlertForm />)

        await user.type(getInput('name'), 'My alert')
        await user.click(screen.getByTestId(CLOSE_WALLET_ALERT_BUTTON_DATA_TEST))

        expect(mockDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({ colorVariant: 'danger' }),
        )
        expect(testMockNavigateFn).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a pristine form', () => {
    describe('WHEN closing it', () => {
      it('THEN should leave without confirmation', async () => {
        const user = userEvent.setup()

        mockLoadedQueries()
        render(<WalletAlertForm />)

        await user.click(screen.getByTestId(CLOSE_WALLET_ALERT_BUTTON_DATA_TEST))

        expect(mockDialogOpen).not.toHaveBeenCalled()
        expect(testMockNavigateFn).toHaveBeenCalled()
      })
    })
  })
})
