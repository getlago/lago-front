import { revalidateLogic, useStore } from '@tanstack/react-form'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { SELECTOR_HOVER_ACTIONS_TEST_ID } from '~/components/designSystem/Selector'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  RecurringTransactionMethodEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { DEFAULT_RULES } from '~/pages/wallet/components/RecurringRuleDrawer'
import {
  RECURRING_RULE_ERROR_TEST_ID,
  RECURRING_RULE_SELECTOR_TEST_ID,
  TopUpSection,
} from '~/pages/wallet/components/TopUpSection'
import { walletFormValidationSchema } from '~/pages/wallet/formInitialization/validationSchema'
import { mapFromApiToForm } from '~/pages/wallet/mappers/mapFromApiToForm'
import { TWalletDataForm, TWalletRecurringRule } from '~/pages/wallet/types'
import { render } from '~/test-utils'

const mockIsPremium = jest.fn(() => true)

// The drawer stack relies on import.meta (unsupported in jest)
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    isPremium: mockIsPremium(),
  }),
}))

const mockOpenPremiumWarningDialog = jest.fn()

jest.mock('~/components/dialogs/PremiumWarningDialog', () => ({
  usePremiumWarningDialog: () => ({
    open: mockOpenPremiumWarningDialog,
  }),
}))

// Capture the props passed to the settings selectors so we can assert the
// per-object wiring (viewType, customer ids) at the wallet level.
const mockInvoicingSelector: jest.Mock<null, [Record<string, unknown>]> = jest.fn()
const mockPaymentSelector: jest.Mock<null, [Record<string, unknown>]> = jest.fn()

jest.mock('~/components/invoicingSettings/InvoicingSettingsSelector', () => ({
  InvoicingSettingsSelector: (props: Record<string, unknown>) => {
    mockInvoicingSelector(props)

    return null
  },
}))

jest.mock('~/components/paymentSettings/PaymentSettingsSelector', () => ({
  PaymentSettingsSelector: (props: Record<string, unknown>) => {
    mockPaymentSelector(props)

    return null
  },
}))

// Stub the rule drawer: the parent only needs its imperative ref + onSave —
// the drawer's own behaviour is covered by RecurringRuleDrawer.test.tsx.
const mockOpenRuleDrawer = jest.fn()

type CapturedDrawerProps = {
  onSave?: (rule: TWalletRecurringRule) => void
  walletValues?: TWalletDataForm
}

const capturedDrawerProps: { current: CapturedDrawerProps | null } = { current: null }

jest.mock('~/pages/wallet/components/RecurringRuleDrawer', () => {
  const actual = jest.requireActual('~/pages/wallet/components/RecurringRuleDrawer')

  return {
    ...actual,
    useRecurringRuleDrawer: (props: CapturedDrawerProps) => {
      capturedDrawerProps.current = props

      return { openDrawer: mockOpenRuleDrawer }
    },
  }
})

const customerData = {
  customer: {
    id: 'customer-id',
    externalId: 'ext-1',
    currency: CurrencyEnum.Usd,
    timezone: null,
    billingEntity: { id: 'be-1' },
  },
} as unknown as GetCustomerInfosForWalletFormQuery

const SUBMIT_BUTTON_DATA_TEST = 'submit-wallet-form'

const formValuesProbe: { current: TWalletDataForm | null } = { current: null }

const TestWrapper = ({
  defaultsOverride,
  initiallyEnabled = false,
  withValidation = false,
}: {
  defaultsOverride?: Partial<TWalletDataForm>
  initiallyEnabled?: boolean
  withValidation?: boolean
}) => {
  const form = useAppForm({
    defaultValues: {
      ...mapFromApiToForm({
        wallet: undefined,
        customerData,
        currency: CurrencyEnum.Usd,
      }),
      ...defaultsOverride,
    },
    // Mirror the CreateWallet form setup so submit runs the real schema
    ...(withValidation
      ? {
          validationLogic: revalidateLogic(),
          validators: { onDynamic: walletFormValidationSchema },
        }
      : {}),
  })

  const [isRecurringTopUpEnabled, setIsRecurringTopUpEnabled] = useState(initiallyEnabled)

  formValuesProbe.current = useStore(form.store, (state) => state.values)

  // Lets tests wait until a submit attempt (and its validation) completed
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts)

  return (
    <>
      <TopUpSection
        form={form}
        formType={FORM_TYPE_ENUM.creation}
        customerData={customerData}
        isRecurringTopUpEnabled={isRecurringTopUpEnabled}
        setIsRecurringTopUpEnabled={setIsRecurringTopUpEnabled}
      />
      {withValidation && (
        <button
          type="button"
          data-test={SUBMIT_BUTTON_DATA_TEST}
          onClick={() => form.handleSubmit()}
        >
          submit ({submissionAttempts})
        </button>
      )}
    </>
  )
}

const withRule = (overrides: Record<string, unknown> = {}): Partial<TWalletDataForm> => ({
  recurringTransactionRules: [
    { ...DEFAULT_RULES, ...overrides },
  ] as TWalletDataForm['recurringTransactionRules'],
})

type CapturedSelectorProps = {
  viewType?: ViewTypeEnum
  customerId?: string
  externalCustomerId?: string
  value?: unknown
  onChange?: (value: unknown) => void
  'data-test'?: string
}

const lastSelectorCall = (
  mock: jest.Mock<null, [Record<string, unknown>]>,
  viewType: ViewTypeEnum,
): CapturedSelectorProps | undefined =>
  mock.mock.calls
    .map((call) => call[0] as CapturedSelectorProps)
    .filter((props) => props.viewType === viewType)
    .at(-1)

describe('TopUpSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremium.mockReturnValue(true)
    capturedDrawerProps.current = null
    formValuesProbe.current = null
  })

  describe('GIVEN a non-premium user', () => {
    describe('WHEN clicking the add recurring rule button', () => {
      it('THEN should open the premium warning dialog and not the drawer', async () => {
        const user = userEvent.setup()

        mockIsPremium.mockReturnValue(false)

        render(<TestWrapper />)

        await user.click(screen.getByTestId('add-recurring-rule-button'))

        expect(mockOpenPremiumWarningDialog).toHaveBeenCalled()
        expect(mockOpenRuleDrawer).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a premium user', () => {
    describe('WHEN clicking the add recurring rule button', () => {
      it('THEN should open the drawer in create mode without committing a rule', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId('add-recurring-rule-button'))

        // Called with no seed → create mode (drawer falls back to defaults)
        expect(mockOpenRuleDrawer).toHaveBeenCalledTimes(1)
        expect(mockOpenRuleDrawer.mock.calls[0]).toHaveLength(0)
        expect(mockOpenPremiumWarningDialog).not.toHaveBeenCalled()
        // Nothing committed until the drawer saves — cancelling keeps the CTA
        expect(formValuesProbe.current?.recurringTransactionRules).toBeUndefined()
      })
    })

    describe('WHEN the drawer saves a rule', () => {
      it('THEN should commit it as a proper array and show the rule card', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId('add-recurring-rule-button'))

        const savedRule = { ...DEFAULT_RULES, thresholdCredits: '100', paidCredits: '50' }

        act(() => {
          capturedDrawerProps.current?.onSave?.(savedRule as TWalletRecurringRule)
        })

        await waitFor(() => {
          expect(screen.getByTestId(RECURRING_RULE_SELECTOR_TEST_ID)).toBeInTheDocument()
        })
        expect(formValuesProbe.current?.recurringTransactionRules).toEqual([savedRule])
      })
    })
  })

  describe('GIVEN an existing rule card', () => {
    describe('WHEN clicking the card', () => {
      it('THEN should open the drawer seeded with the current rule', async () => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={withRule({ paidCredits: '42' })} />)

        await user.click(screen.getByTestId(RECURRING_RULE_SELECTOR_TEST_ID))

        expect(mockOpenRuleDrawer).toHaveBeenCalledWith(
          expect.objectContaining({ paidCredits: '42' }),
        )
      })
    })

    describe('WHEN clicking the hover edit action', () => {
      it('THEN should open the drawer seeded with the current rule', async () => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={withRule({ paidCredits: '42' })} />)

        const actions = within(screen.getByTestId(SELECTOR_HOVER_ACTIONS_TEST_ID)).getAllByRole(
          'button',
        )

        // [0] = trash, [1] = pen
        await user.click(actions[1])

        expect(mockOpenRuleDrawer).toHaveBeenCalledWith(
          expect.objectContaining({ paidCredits: '42' }),
        )
      })
    })

    describe('WHEN clicking the hover delete action', () => {
      it('THEN should clear the rule and fall back to the create CTA', async () => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={withRule()} />)

        const actions = within(screen.getByTestId(SELECTOR_HOVER_ACTIONS_TEST_ID)).getAllByRole(
          'button',
        )

        await user.click(actions[0])

        await waitFor(() => {
          expect(screen.getByTestId('add-recurring-rule-button')).toBeInTheDocument()
        })
        expect(formValuesProbe.current?.recurringTransactionRules).toBeUndefined()
        expect(mockOpenRuleDrawer).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the rule error caption under the card', () => {
    describe('WHEN submitting with a rule invalidated by the wallet bounds', () => {
      it('THEN should surface the drawer-scoped error under the card', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            initiallyEnabled
            withValidation
            defaultsOverride={{
              // Bounds changed AFTER the rule was committed: 50 is out of range
              paidTopUpMinAmountCents: '100',
              paidTopUpMaxAmountCents: '200',
              ...withRule({ thresholdCredits: '100', paidCredits: '50' }),
            }}
          />,
        )

        // revalidateLogic: no error surfaces before the first submit attempt
        expect(screen.queryByTestId(RECURRING_RULE_ERROR_TEST_ID)).toBeNull()

        await user.click(screen.getByTestId(SUBMIT_BUTTON_DATA_TEST))

        await waitFor(() => {
          expect(screen.getByTestId(RECURRING_RULE_ERROR_TEST_ID)).toBeInTheDocument()
        })
      })
    })

    describe('WHEN submitting with a valid rule but errors on wallet-level fields', () => {
      it('THEN should keep the caption hidden (wallet fields show their own errors)', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            initiallyEnabled
            withValidation
            defaultsOverride={{
              // top-level error OUTSIDE the rules: rateAmount is required
              rateAmount: '',
              ...withRule({ thresholdCredits: '100', paidCredits: '50' }),
            }}
          />,
        )

        await user.click(screen.getByTestId(SUBMIT_BUTTON_DATA_TEST))

        // Wait for the submit attempt to be registered — validation has run
        await waitFor(() => {
          expect(screen.getByTestId(SUBMIT_BUTTON_DATA_TEST)).toHaveTextContent('submit (1)')
        })

        expect(screen.queryByTestId(RECURRING_RULE_ERROR_TEST_ID)).toBeNull()
      })
    })
  })

  describe('GIVEN the wallet-level settings selectors', () => {
    describe('WHEN the customer has an id and an externalId', () => {
      it('THEN should wire the invoicing selector to the customer id', () => {
        render(<TestWrapper />)

        const props = lastSelectorCall(mockInvoicingSelector, ViewTypeEnum.WalletTopUp)

        expect(props).toBeDefined()
        expect(props?.customerId).toBe('customer-id')
      })

      it('THEN should wire the payment selector to the external customer id', () => {
        render(<TestWrapper />)

        const props = lastSelectorCall(mockPaymentSelector, ViewTypeEnum.WalletTopUp)

        expect(props).toBeDefined()
        expect(props?.externalCustomerId).toBe('ext-1')
      })
    })
  })

  describe('GIVEN the drawer wiring', () => {
    describe('WHEN the section renders', () => {
      it('THEN should feed the drawer the live wallet values (bounds context)', () => {
        render(
          <TestWrapper
            defaultsOverride={{
              paidTopUpMinAmountCents: '10',
              paidTopUpMaxAmountCents: '100',
            }}
          />,
        )

        expect(capturedDrawerProps.current?.walletValues).toEqual(
          expect.objectContaining({
            paidTopUpMinAmountCents: '10',
            paidTopUpMaxAmountCents: '100',
          }),
        )
      })
    })
  })

  describe('GIVEN a Target method rule committed through the drawer', () => {
    describe('WHEN the drawer saves it', () => {
      it('THEN should keep the method in the committed array', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByTestId('add-recurring-rule-button'))

        const targetRule = {
          ...DEFAULT_RULES,
          method: RecurringTransactionMethodEnum.Target,
          targetOngoingBalance: '200',
          thresholdCredits: '100',
          grantsTargetTopUp: false,
        }

        act(() => {
          capturedDrawerProps.current?.onSave?.(targetRule as TWalletRecurringRule)
        })

        expect(formValuesProbe.current?.recurringTransactionRules?.[0]?.method).toBe(
          RecurringTransactionMethodEnum.Target,
        )
      })
    })
  })
})
