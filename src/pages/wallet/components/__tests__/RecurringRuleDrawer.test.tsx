import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, ReactNode } from 'react'

import {
  ADD_METADATA_DATA_TEST,
  RECURRING_IGNORE_PAID_TOPUP_LIMITS_SWITCH_DATA_TEST,
  RECURRING_TOPUP_TYPE_DATA_TEST,
  SHOW_RECURRING_EXPIRATION_AT_DATA_TEST,
} from '~/components/wallets/utils/dataTestConstants'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import {
  CurrencyEnum,
  GetCustomerInfosForWalletFormQuery,
  RecurringTransactionMethodEnum,
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

type OpenedDrawer = {
  form: { id: string; submit: () => Promise<void> | void }
  children: ReactNode
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
})
