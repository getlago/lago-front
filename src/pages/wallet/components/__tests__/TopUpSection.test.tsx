import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import {
  ADD_METADATA_DATA_TEST,
  RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
  RECURRING_TOPUP_TYPE_DATA_TEST,
  SHOW_RECURRING_EXPIRATION_AT_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { FORM_TYPE_ENUM } from '~/core/constants/form'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  RecurringTransactionMethodEnum,
} from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { DEFAULT_RULES, TopUpSection } from '~/pages/wallet/components/TopUpSection'
import { mapFromApiToForm } from '~/pages/wallet/mappers/mapFromApiToForm'
import { TWalletDataForm } from '~/pages/wallet/types'
import { render } from '~/test-utils'

const mockIsPremium = jest.fn(() => true)

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

// Owns its own queries/tests — stub it to keep this suite focused.
jest.mock('~/components/paymentMethodsInvoiceSettings/PaymentMethodsInvoiceSettings', () => ({
  PaymentMethodsInvoiceSettings: () => <div data-test="payment-methods-settings-stub" />,
}))

const customerData = {
  customer: {
    id: 'customer-id',
    externalId: 'ext-1',
    currency: CurrencyEnum.Usd,
    timezone: null,
    billingEntity: { id: 'be-1' },
  },
} as unknown as GetCustomerInfosForWalletFormQuery

const TestWrapper = ({
  defaultsOverride,
  initiallyEnabled = false,
}: {
  defaultsOverride?: Partial<TWalletDataForm>
  initiallyEnabled?: boolean
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
  })

  const [isRecurringTopUpEnabled, setIsRecurringTopUpEnabled] = useState(initiallyEnabled)

  return (
    <TopUpSection
      form={form}
      formType={FORM_TYPE_ENUM.creation}
      customerData={customerData}
      isRecurringTopUpEnabled={isRecurringTopUpEnabled}
      setIsRecurringTopUpEnabled={setIsRecurringTopUpEnabled}
    />
  )
}

const queryInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

// The accordion starts collapsed when the rule comes from existing data —
// expand it the same way a user would, by clicking its summary.
const openAccordion = async (user: ReturnType<typeof userEvent.setup>) => {
  const summary = document.querySelector('.MuiAccordionSummary-root') as HTMLElement

  await user.click(summary)
  await waitFor(() => {
    expect(document.querySelector('.MuiCollapse-entered')).toBeInTheDocument()
  })
}

const withRule = (overrides: Record<string, unknown> = {}): Partial<TWalletDataForm> => ({
  recurringTransactionRules: [
    { ...DEFAULT_RULES, ...overrides },
  ] as TWalletDataForm['recurringTransactionRules'],
})

describe('TopUpSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremium.mockReturnValue(true)
  })

  describe('GIVEN a non-premium user', () => {
    describe('WHEN clicking the add recurring rule button', () => {
      it('THEN should open the premium warning dialog and not enable the rule', async () => {
        const user = userEvent.setup()

        mockIsPremium.mockReturnValue(false)

        render(<TestWrapper />)

        await user.click(screen.getByRole('button'))

        expect(mockOpenPremiumWarningDialog).toHaveBeenCalled()
        expect(queryInput('recurringTransactionRules[0].transactionName')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a premium user', () => {
    describe('WHEN clicking the add recurring rule button', () => {
      it('THEN should enable the rule as a proper array and open the accordion', async () => {
        const user = userEvent.setup()

        render(<TestWrapper />)

        await user.click(screen.getByRole('button'))

        await waitFor(() => {
          expect(queryInput('recurringTransactionRules[0].transactionName')).toBeInTheDocument()
        })
        expect(mockOpenPremiumWarningDialog).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a Fixed method rule', () => {
    describe('WHEN the accordion renders', () => {
      it.each([
        ['paid credits', 'recurringTransactionRules[0].paidCredits'],
        ['granted credits', 'recurringTransactionRules[0].grantedCredits'],
      ])('THEN should display the %s input', async (_, name) => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={withRule()} />)
        await openAccordion(user)

        expect(queryInput(name)).toBeInTheDocument()
      })

      it('THEN should not display the target ongoing balance input', async () => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={withRule()} />)
        await openAccordion(user)

        expect(queryInput('recurringTransactionRules[0].targetOngoingBalance')).toBeNull()
      })
    })

    describe('WHEN paid credits are set and the wallet has bounds', () => {
      it('THEN should display the ignore-limits switch', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            initiallyEnabled
            defaultsOverride={{
              paidTopUpMinAmountCents: '10',
              paidTopUpMaxAmountCents: '100',
              ...withRule({ paidCredits: '50' }),
            }}
          />,
        )
        await openAccordion(user)

        expect(
          document.querySelector(
            `[data-test="${RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`,
          ),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a Target method rule', () => {
    const targetRule = withRule({
      method: RecurringTransactionMethodEnum.Target,
      targetOngoingBalance: '',
      grantsTargetTopUp: false,
    })

    describe('WHEN the accordion renders', () => {
      it('THEN should display the top-up type selector and target balance input', async () => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={targetRule} />)
        await openAccordion(user)

        expect(
          document.querySelector(`[data-test="${RECURRING_TOPUP_TYPE_DATA_TEST}"]`),
        ).toBeInTheDocument()
        expect(queryInput('recurringTransactionRules[0].targetOngoingBalance')).toBeInTheDocument()
      })

      it('THEN should not display the fixed credits inputs', async () => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={targetRule} />)
        await openAccordion(user)

        expect(queryInput('recurringTransactionRules[0].paidCredits')).toBeNull()
        expect(queryInput('recurringTransactionRules[0].grantedCredits')).toBeNull()
      })
    })
  })

  describe('GIVEN the rule expiration toggle', () => {
    describe('WHEN clicking add expiration date', () => {
      it('THEN should display the expiration date picker', async () => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={withRule()} />)
        await openAccordion(user)

        expect(queryInput('recurringTransactionRules[0].expirationAt')).toBeNull()

        await user.click(screen.getByTestId(SHOW_RECURRING_EXPIRATION_AT_DATA_TEST))

        await waitFor(() => {
          expect(queryInput('recurringTransactionRules[0].expirationAt')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the transaction metadata rows', () => {
    describe('WHEN clicking add new field twice', () => {
      it('THEN should display two key/value rows', async () => {
        const user = userEvent.setup()

        render(<TestWrapper initiallyEnabled defaultsOverride={withRule()} />)
        await openAccordion(user)

        await user.click(screen.getByTestId(ADD_METADATA_DATA_TEST))
        await user.click(screen.getByTestId(ADD_METADATA_DATA_TEST))

        await waitFor(() => {
          expect(
            queryInput('recurringTransactionRules[0].transactionMetadata[1].key'),
          ).toBeInTheDocument()
        })
      })
    })

    describe('WHEN deleting a metadata row', () => {
      it('THEN should remove the row', async () => {
        const user = userEvent.setup()

        render(
          <TestWrapper
            initiallyEnabled
            defaultsOverride={withRule({
              transactionMetadata: [{ key: 'existing', value: 'row' }],
            })}
          />,
        )
        await openAccordion(user)

        expect(queryInput('recurringTransactionRules[0].transactionMetadata[0].key')).toHaveValue(
          'existing',
        )

        // The delete button is the trash button inside the metadata row
        const metadataKeyInput = queryInput(
          'recurringTransactionRules[0].transactionMetadata[0].key',
        )
        const row = metadataKeyInput.closest('.flex.w-full.flex-row') as HTMLElement
        const deleteButton = row.querySelector('button:last-of-type') as HTMLButtonElement

        await user.click(deleteButton)

        await waitFor(() => {
          expect(queryInput('recurringTransactionRules[0].transactionMetadata[0].key')).toBeNull()
        })
      })
    })
  })
})
