import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateTime } from 'luxon'
import { createRef, ReactNode } from 'react'

import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import {
  ADD_METADATA_DATA_TEST,
  DELETE_RECURRING_EXPIRATION_AT_DATA_TEST,
  RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
  RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST,
  RECURRING_TOPUP_TYPE_DATA_TEST,
  SHOW_RECURRING_EXPIRATION_AT_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import {
  DEFAULT_RULES,
  RecurringRuleDrawer,
  RecurringRuleDrawerRef,
} from '~/pages/wallet/components/RecurringRuleDrawer'
import { TWalletDataForm, TWalletRecurringRule } from '~/pages/wallet/types'
import { render } from '~/test-utils'

const mockOpen = jest.fn()
const mockClose = jest.fn()

// The drawer stack relies on import.meta (unsupported in jest)
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/components/drawers/useFocusTrap', () => ({
  focusFirstInput: jest.fn(),
}))

// The ComboBox option list is virtualized: @tanstack/react-virtual measures a
// 0px-tall scroll container in jsdom and renders no option at all, so flatten it.
jest.mock('~/components/form/ComboBox/ComboBoxVirtualizedList', () => ({
  GROUP_ITEM_KEY: 'combobox-group-by',
  ComboBoxVirtualizedList: ({ elements }: { elements: ReactNode[] }) => <>{elements}</>,
}))

// Capture the nested settings selectors (their drawers stack on their own —
// covered by their dedicated suites).
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

const customerData = {
  customer: {
    id: 'customer-id',
    externalId: 'ext-1',
    currency: CurrencyEnum.Usd,
    timezone: null,
    billingEntity: { id: 'be-1' },
  },
} as unknown as GetCustomerInfosForWalletFormQuery

const walletValues = {
  currency: CurrencyEnum.Usd,
  rateAmount: '1',
  paidTopUpMinAmountCents: null,
  paidTopUpMaxAmountCents: null,
} as unknown as TWalletDataForm

const queryInput = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

// ButtonSelector tags every option with its own value
const buttonSelectorOption = (value: boolean) => `button-selector-${value}`

// Clearing widens the list back to every option (a selected ComboBox otherwise
// filters itself down to the current one) and the chevron adornment is what
// opens the popup. Each option row carries its enum value as data-test.
const selectComboBoxOption = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  optionValue: string,
) => {
  const input = queryInput(name)
  const chevron = input.parentElement?.querySelector('[data-test^="chevron-up-down"]') as SVGElement

  await user.clear(input)
  await user.click(chevron.closest('button') as HTMLButtonElement)

  // Poppers are portalled and a closing one can still linger, so take the row
  // from the last rendered list.
  const option = await waitFor(() => screen.getAllByTestId(optionValue).at(-1) as HTMLElement)

  await user.click(option)
}

type OpenedDrawer = {
  form: { id: string; submit: () => Promise<void> | void }
  children: ReactNode
  shouldPromptOnClose: () => boolean
  onClose: () => void
  onEntered: (container: HTMLElement) => void
}

describe('RecurringRuleDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderDrawer = ({
    onSave = jest.fn(),
    values = walletValues,
  }: {
    onSave?: jest.Mock
    values?: TWalletDataForm
  } = {}) => {
    const ref = createRef<RecurringRuleDrawerRef>()

    render(
      <RecurringRuleDrawer
        ref={ref}
        customerData={customerData}
        walletValues={values}
        onSave={onSave}
      />,
    )

    return { ref, onSave }
  }

  // drawer.open is mocked, so the content children never mount on their own —
  // render them explicitly like a drawer body would.
  const openAndMount = (ref: React.RefObject<RecurringRuleDrawerRef>, rule?: unknown) => {
    act(() => {
      ref.current?.openDrawer(rule as TWalletRecurringRule | undefined)
    })

    const opened = mockOpen.mock.calls.at(-1)?.[0] as OpenedDrawer

    render(<>{opened.children}</>)

    return opened
  }

  describe('GIVEN the create flow (no seed)', () => {
    describe('WHEN the drawer opens', () => {
      it('THEN should mount the Fixed-method fields from the defaults', () => {
        const { ref } = renderDrawer()

        openAndMount(ref)

        expect(queryInput('paidCredits')).toBeInTheDocument()
        expect(queryInput('grantedCredits')).toBeInTheDocument()
        expect(queryInput('targetOngoingBalance')).toBeNull()
      })
    })

    describe('WHEN submitting with the invalid defaults (threshold credits missing)', () => {
      it('THEN should not save nor close', async () => {
        const { ref, onSave } = renderDrawer()

        const opened = openAndMount(ref)

        await act(async () => {
          await opened.form.submit()
        })

        expect(onSave).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN submitting a valid draft', () => {
      it('THEN should commit the values through onSave and close', async () => {
        const { ref, onSave } = renderDrawer()

        const opened = openAndMount(ref, {
          ...DEFAULT_RULES,
          thresholdCredits: '100',
          paidCredits: '50',
        })

        await act(async () => {
          await opened.form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({ thresholdCredits: '100', paidCredits: '50' }),
        )
        expect(mockClose).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the edit flow (seeded rule)', () => {
    describe('WHEN saving without touching anything', () => {
      it('THEN should round-trip lagoId untouched (update, not create)', async () => {
        const { ref, onSave } = renderDrawer()

        const opened = openAndMount(ref, {
          ...DEFAULT_RULES,
          lagoId: 'rule-lago-id',
          thresholdCredits: '100',
          paidCredits: '50',
        })

        await act(async () => {
          await opened.form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ lagoId: 'rule-lago-id' }))
      })

      it('THEN should preserve every seeded value verbatim — nulls must not fall back to defaults', async () => {
        const { ref, onSave } = renderDrawer()

        // API-hydrated shape: startedAt null (recurrence anchored to the
        // wallet's createdAt — resurrecting the now() default would silently
        // move the anchor, cf. ING-489), interval null (threshold rule),
        // metadata and name persisted.
        const seeded = {
          ...DEFAULT_RULES,
          lagoId: 'rule-lago-id',
          thresholdCredits: '100',
          paidCredits: '50',
          startedAt: null,
          interval: null,
          expirationAt: null,
          transactionName: 'My rule',
          transactionMetadata: [{ key: 'k1', value: 'v1' }],
          ignorePaidTopUpLimits: true,
        }

        const opened = openAndMount(ref, seeded)

        await act(async () => {
          await opened.form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            startedAt: null,
            interval: null,
            expirationAt: null,
            transactionName: 'My rule',
            transactionMetadata: [{ key: 'k1', value: 'v1' }],
            ignorePaidTopUpLimits: true,
          }),
        )
      })
    })
  })

  describe('GIVEN a Target method rule', () => {
    describe('WHEN the drawer renders', () => {
      it('THEN should display the top-up type selector and target balance input only', () => {
        const { ref } = renderDrawer()

        openAndMount(ref, {
          ...DEFAULT_RULES,
          method: RecurringTransactionMethodEnum.Target,
          targetOngoingBalance: '',
          grantsTargetTopUp: false,
        })

        expect(
          document.querySelector(`[data-test="${RECURRING_TOPUP_TYPE_DATA_TEST}"]`),
        ).toBeInTheDocument()
        expect(queryInput('targetOngoingBalance')).toBeInTheDocument()
        expect(queryInput('paidCredits')).toBeNull()
        expect(queryInput('grantedCredits')).toBeNull()
      })
    })
  })

  describe('GIVEN a wallet with paid top-up bounds', () => {
    describe('WHEN paid credits are set', () => {
      it('THEN should display the ignore-limits switch', () => {
        const { ref } = renderDrawer({
          values: {
            ...walletValues,
            paidTopUpMinAmountCents: '10',
            paidTopUpMaxAmountCents: '100',
          } as TWalletDataForm,
        })

        openAndMount(ref, { ...DEFAULT_RULES, paidCredits: '50' })

        expect(
          document.querySelector(
            `[data-test="${RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST}"]`,
          ),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the rule expiration toggle', () => {
    describe('WHEN clicking add expiration date', () => {
      it('THEN should display the expiration date picker', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        openAndMount(ref)

        expect(queryInput('expirationAt')).toBeNull()

        await user.click(screen.getByTestId(SHOW_RECURRING_EXPIRATION_AT_DATA_TEST))

        await waitFor(() => {
          expect(queryInput('expirationAt')).toBeInTheDocument()
        })
      })
    })
  })

  describe('GIVEN the transaction metadata rows', () => {
    describe('WHEN clicking add new field twice', () => {
      it('THEN should display two key/value rows', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        openAndMount(ref)

        await user.click(screen.getByTestId(ADD_METADATA_DATA_TEST))
        await user.click(screen.getByTestId(ADD_METADATA_DATA_TEST))

        await waitFor(() => {
          expect(queryInput('transactionMetadata[1].key')).toBeInTheDocument()
        })
      })
    })

    describe('WHEN deleting a metadata row', () => {
      it('THEN should remove the row', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        openAndMount(ref, {
          ...DEFAULT_RULES,
          transactionMetadata: [{ key: 'existing', value: 'row' }],
        })

        expect(queryInput('transactionMetadata[0].key')).toHaveValue('existing')

        // The delete button is the trash button inside the metadata row
        const metadataKeyInput = queryInput('transactionMetadata[0].key')
        const row = metadataKeyInput.closest('.flex.w-full.flex-row') as HTMLElement
        const deleteButton = row.querySelector('button:last-of-type') as HTMLButtonElement

        await user.click(deleteButton)

        await waitFor(() => {
          expect(queryInput('transactionMetadata[0].key')).toBeNull()
        })
      })
    })
  })

  describe('GIVEN the nested settings selectors', () => {
    describe('WHEN the drawer content mounts', () => {
      it.each([
        ['invoicing', () => mockInvoicingSelector, 'rule-invoicing-settings-selector'],
        ['payment', () => mockPaymentSelector, 'rule-payment-settings-selector'],
      ])('THEN should tag the rule %s selector with its data-test', (_, getMock, dataTest) => {
        const { ref } = renderDrawer()

        openAndMount(ref)

        const props = getMock().mock.calls.at(-1)?.[0] as Record<string, unknown>

        expect(props?.viewType).toBe(ViewTypeEnum.WalletRecurringTopUp)
        expect(props?.['data-test']).toBe(dataTest)
      })
    })

    describe('WHEN the invoicing selector reports a change', () => {
      it('THEN should carry the value into the saved rule', async () => {
        const { ref, onSave } = renderDrawer()

        const opened = openAndMount(ref, {
          ...DEFAULT_RULES,
          thresholdCredits: '100',
          paidCredits: '50',
        })

        const next = {
          invoiceCustomSections: [{ id: 'cs_rule', name: 'Rule footer' }],
          skipInvoiceCustomSections: false,
        }

        const props = mockInvoicingSelector.mock.calls.at(-1)?.[0] as {
          onChange?: (value: unknown) => void
        }

        act(() => {
          props?.onChange?.(next)
        })

        await act(async () => {
          await opened.form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ invoiceCustomSection: next }))
      })
    })

    describe('WHEN the payment selector reports a change', () => {
      it('THEN should carry the value into the saved rule', async () => {
        const { ref, onSave } = renderDrawer()

        const opened = openAndMount(ref, {
          ...DEFAULT_RULES,
          thresholdCredits: '100',
          paidCredits: '50',
        })

        const next = { paymentMethodId: 'pm_rule', paymentMethodType: 'provider' }

        const props = mockPaymentSelector.mock.calls.at(-1)?.[0] as {
          onChange?: (value: unknown) => void
        }

        act(() => {
          props?.onChange?.(next)
        })

        await act(async () => {
          await opened.form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: next }))
      })
    })
  })

  describe('GIVEN a Fixed rule with credits already filled', () => {
    describe('WHEN switching the method to Target and back to Fixed', () => {
      it('THEN should reset the credit fields to their defaults', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        openAndMount(ref, { ...DEFAULT_RULES, paidCredits: '50', grantedCredits: '20' })

        await selectComboBoxOption(user, 'method', RecurringTransactionMethodEnum.Target)

        await waitFor(() => {
          expect(screen.getByTestId(RECURRING_TOPUP_TYPE_DATA_TEST)).toBeInTheDocument()
        })
        expect(queryInput('paidCredits')).toBeNull()

        await selectComboBoxOption(user, 'method', RecurringTransactionMethodEnum.Fixed)

        await waitFor(() => {
          expect(queryInput('paidCredits')).toBeInTheDocument()
        })
        expect(queryInput('paidCredits')).toHaveValue('')
        expect(queryInput('grantedCredits')).toHaveValue('')
      })
    })
  })

  describe('GIVEN a Threshold-triggered rule', () => {
    describe('WHEN switching the trigger to Interval', () => {
      it('THEN should mount the interval and start-date fields and drop the threshold', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        openAndMount(ref, { ...DEFAULT_RULES, thresholdCredits: '100', paidCredits: '50' })

        await selectComboBoxOption(user, 'trigger', RecurringTransactionTriggerEnum.Interval)

        await waitFor(() => {
          expect(queryInput('interval')).toBeInTheDocument()
        })
        expect(queryInput('startedAt')).toBeInTheDocument()
        expect(queryInput('thresholdCredits')).toBeNull()
      })
    })
  })

  describe('GIVEN an Interval-triggered rule', () => {
    describe('WHEN switching the trigger to Threshold', () => {
      it('THEN should mount the threshold field and drop the interval fields', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        openAndMount(ref, {
          ...DEFAULT_RULES,
          trigger: RecurringTransactionTriggerEnum.Interval,
          paidCredits: '50',
        })

        await selectComboBoxOption(user, 'trigger', RecurringTransactionTriggerEnum.Threshold)

        await waitFor(() => {
          expect(queryInput('thresholdCredits')).toBeInTheDocument()
        })
        expect(queryInput('interval')).toBeNull()
        expect(queryInput('startedAt')).toBeNull()
      })
    })
  })

  describe('GIVEN paid credits on a wallet with top-up bounds', () => {
    describe('WHEN toggling one of the paid-credits switches', () => {
      it.each([
        [
          'ignore-limits',
          RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
          'ignorePaidTopUpLimits',
        ],
        [
          'requires-successful-payment',
          RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST,
          'invoiceRequiresSuccessfulPayment',
        ],
      ])('THEN should carry the %s flag into the saved rule', async (_, dataTest, field) => {
        const user = userEvent.setup()
        const { ref, onSave } = renderDrawer({
          values: {
            ...walletValues,
            paidTopUpMinAmountCents: '10',
            paidTopUpMaxAmountCents: '100',
          } as TWalletDataForm,
        })

        const opened = openAndMount(ref, {
          ...DEFAULT_RULES,
          thresholdCredits: '100',
          paidCredits: '50',
        })

        await user.click(screen.getByTestId(dataTest))

        await act(async () => {
          await opened.form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ [field]: true }))
      })
    })
  })

  describe('GIVEN a Target rule with a target balance', () => {
    describe('WHEN toggling the top-up type and the requires-successful-payment switch', () => {
      it('THEN should carry both values into the saved rule', async () => {
        const user = userEvent.setup()
        const { ref, onSave } = renderDrawer()

        const opened = openAndMount(ref, {
          ...DEFAULT_RULES,
          method: RecurringTransactionMethodEnum.Target,
          targetOngoingBalance: '100',
          grantsTargetTopUp: false,
          thresholdCredits: '10',
        })

        // `true` is the "grants credits" option of the top-up type selector
        await user.click(screen.getByTestId(buttonSelectorOption(true)))
        await user.click(
          screen.getByTestId(RECURRING_INVOICE_REQUIRES_SUCCESSFUL_PAYMENT_SWITCH_DATA_TEST),
        )

        await act(async () => {
          await opened.form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            grantsTargetTopUp: true,
            invoiceRequiresSuccessfulPayment: true,
          }),
        )
      })
    })

    describe('WHEN the target balance is below the threshold', () => {
      it('THEN should flag the target balance as invalid and block the save', async () => {
        const { ref, onSave } = renderDrawer()

        const opened = openAndMount(ref, {
          ...DEFAULT_RULES,
          method: RecurringTransactionMethodEnum.Target,
          targetOngoingBalance: '100',
          grantsTargetTopUp: false,
          thresholdCredits: '200',
        })

        expect(queryInput('targetOngoingBalance')).toHaveAttribute('aria-invalid', 'false')

        await act(async () => {
          await opened.form.submit()
        })

        await waitFor(() => {
          expect(queryInput('targetOngoingBalance')).toHaveAttribute('aria-invalid', 'true')
        })
        expect(onSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a rule expiration date already set', () => {
    describe('WHEN clicking the delete expiration button', () => {
      it('THEN should drop the date picker back to the add button', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        openAndMount(ref, { ...DEFAULT_RULES, expirationAt: '' })

        await user.click(screen.getByTestId(DELETE_RECURRING_EXPIRATION_AT_DATA_TEST))

        await waitFor(() => {
          expect(queryInput('expirationAt')).toBeNull()
        })
        expect(screen.getByTestId(SHOW_RECURRING_EXPIRATION_AT_DATA_TEST)).toBeInTheDocument()
      })
    })

    describe('WHEN the expiration date is in the past', () => {
      it('THEN should flag the expiration date as invalid and block the save', async () => {
        const { ref, onSave } = renderDrawer()

        const opened = openAndMount(ref, {
          ...DEFAULT_RULES,
          thresholdCredits: '100',
          paidCredits: '50',
          expirationAt: DateTime.now().minus({ days: 2 }).toISO(),
        })

        expect(queryInput('expirationAt')).toHaveAttribute('aria-invalid', 'false')

        await act(async () => {
          await opened.form.submit()
        })

        await waitFor(() => {
          expect(queryInput('expirationAt')).toHaveAttribute('aria-invalid', 'true')
        })
        expect(onSave).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the drawer stack configuration', () => {
    describe('WHEN the drawer is opened', () => {
      it('THEN should focus the first input once entered', () => {
        const { ref } = renderDrawer()

        const opened = openAndMount(ref)
        const container = document.createElement('div')

        opened.onEntered(container)

        expect(focusFirstInput).toHaveBeenCalledWith(container)
      })

      it('THEN should only prompt on close once the draft is dirty', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        const opened = openAndMount(ref)

        expect(opened.shouldPromptOnClose()).toBe(false)

        await user.type(queryInput('paidCredits'), '50')

        await waitFor(() => {
          expect(opened.shouldPromptOnClose()).toBe(true)
        })
      })

      it('THEN should reset the draft on close', async () => {
        const user = userEvent.setup()
        const { ref } = renderDrawer()

        const opened = openAndMount(ref)

        await user.type(queryInput('paidCredits'), '50')

        await waitFor(() => {
          expect(queryInput('paidCredits')).toHaveValue('50')
        })

        act(() => {
          opened.onClose()
        })

        await waitFor(() => {
          expect(queryInput('paidCredits')).toHaveValue('')
        })
      })
    })

    describe('WHEN closeDrawer is called through the ref', () => {
      it('THEN should close the drawer', () => {
        const { ref } = renderDrawer()

        openAndMount(ref)

        act(() => {
          ref.current?.closeDrawer()
        })

        expect(mockClose).toHaveBeenCalled()
      })
    })
  })
})
