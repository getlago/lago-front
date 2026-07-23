import { makeEmptyWalletItem } from '~/core/serializers/serializeQuoteWallets'
import {
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'

import {
  isWalletItemPersistable,
  itemToRecurring,
  recurringToItem,
  settingsToItem,
  topUpWithinLimits,
  walletFreeAndPaidSchema,
  type WalletRecurringSlice,
  walletSettingsSchema,
} from '../walletFormSchema'

const errorKey = (result: ReturnType<ReturnType<typeof walletFreeAndPaidSchema>['safeParse']>) =>
  result.success ? null : result.error.issues[0]?.message

const freeAndPaid = (paidCredits: string) => ({
  freeCredits: '',
  paidCredits,
  invoiceRequiresSuccessfulPayment: false,
  metadata: [],
})

describe('walletFormSchema', () => {
  it('rejects settings with priority above 50', () => {
    const result = walletSettingsSchema.safeParse({
      name: '',
      rateAmount: '1',
      priority: '51',
      expirationAt: null,
      paidTopUpMinAmountCents: null,
      paidTopUpMaxAmountCents: null,
      purchaseOrderNumber: null,
    })

    expect(result.success).toBe(false)
  })

  it('rejects a non-numeric rateAmount (NaN must not slip past the <= 0 guard)', () => {
    const result = walletSettingsSchema.safeParse({
      name: '',
      rateAmount: 'abc',
      priority: '30',
      expirationAt: null,
      paidTopUpMinAmountCents: null,
      paidTopUpMaxAmountCents: null,
      purchaseOrderNumber: null,
    })

    expect(result.success).toBe(false)
  })

  it('accepts an in-range string priority from the text input', () => {
    const result = walletSettingsSchema.safeParse({
      name: '',
      rateAmount: '1',
      priority: '30',
      expirationAt: null,
      paidTopUpMinAmountCents: null,
      paidTopUpMaxAmountCents: null,
      purchaseOrderNumber: null,
    })

    expect(result.success).toBe(true)
  })

  it('settingsToItem coerces a string priority to a number (falls back on NaN)', () => {
    const item = makeEmptyWalletItem('wl_1')
    const base = {
      name: '',
      rateAmount: '1',
      expirationAt: null,
      paidTopUpMinAmountCents: null,
      paidTopUpMaxAmountCents: null,
      purchaseOrderNumber: null,
    }

    expect(settingsToItem(item, { ...base, priority: '30' }).priority).toBe(30)
    expect(settingsToItem(item, { ...base, priority: 'abc' }).priority).toBe(item.priority)
  })

  it('rejects settings where min > max', () => {
    const result = walletSettingsSchema.safeParse({
      name: '',
      rateAmount: '1',
      priority: '1',
      expirationAt: null,
      paidTopUpMinAmountCents: '100',
      paidTopUpMaxAmountCents: '10',
      purchaseOrderNumber: null,
    })

    expect(result.success).toBe(false)
  })

  it('topUpWithinLimits validates paid credit amount against min/max', () => {
    expect(topUpWithinLimits({ rateAmount: '1', credits: '50', min: '10', max: '100' })).toBe(true)
    expect(topUpWithinLimits({ rateAmount: '1', credits: '5', min: '10', max: '100' })).toBe(false)
  })

  it('isWalletItemPersistable requires a rate and at least one credit', () => {
    const empty = makeEmptyWalletItem('wl_1')

    expect(isWalletItemPersistable(empty)).toBe(false)
    expect(isWalletItemPersistable({ ...empty, rateAmount: '1', paidCredits: '10' })).toBe(true)
    expect(isWalletItemPersistable({ ...empty, rateAmount: '1', freeCredits: '5' })).toBe(true)
  })

  it('recurring slice round-trips through item', () => {
    const empty = makeEmptyWalletItem('wl_1')
    const item = recurringToItem(empty, itemToRecurring(empty))

    expect(item.recurringRule).toBeNull()
  })

  it('walletFreeAndPaidSchema picks the message matching the violated bound', () => {
    // min-only, below → "below" key
    const belowOnly = walletFreeAndPaidSchema({ rateAmount: '1', min: '10', max: null }).safeParse(
      freeAndPaid('5'),
    )

    expect(errorKey(belowOnly)).toBe('text_1758285686647tnf634qa99c')

    // max-only, above → "above" key
    const aboveOnly = walletFreeAndPaidSchema({ rateAmount: '1', min: null, max: '100' }).safeParse(
      freeAndPaid('150'),
    )

    expect(errorKey(aboveOnly)).toBe('text_175828568664787kip4pzn8l')

    // both bounds set, violated → "between" key
    const between = walletFreeAndPaidSchema({ rateAmount: '1', min: '10', max: '100' }).safeParse(
      freeAndPaid('5'),
    )

    expect(errorKey(between)).toBe('text_1758285686647a868tiok58q')

    // within bounds → valid
    const ok = walletFreeAndPaidSchema({ rateAmount: '1', min: '10', max: '100' }).safeParse(
      freeAndPaid('50'),
    )

    expect(ok.success).toBe(true)
  })

  it('recurringToItem nulls the fields that do not apply to the chosen trigger/method', () => {
    const empty = makeEmptyWalletItem('wl_1')

    const targetInterval: WalletRecurringSlice = {
      enabled: true,
      method: RecurringTransactionMethodEnum.Target,
      transactionName: 'Top-up',
      paidCredits: '500',
      grantedCredits: '0',
      invoiceRequiresSuccessfulPayment: true,
      targetOngoingBalance: '1000',
      trigger: RecurringTransactionTriggerEnum.Interval,
      interval: RecurringTransactionIntervalEnum.Monthly,
      thresholdCredits: '99', // must be nulled (trigger is Interval)
      startedAt: '2027-01-01T00:00:00Z',
      expirationAt: null,
    }

    const rule = recurringToItem(empty, targetInterval).recurringRule

    expect(rule).not.toBeNull()
    expect(rule?.interval).toBe(RecurringTransactionIntervalEnum.Monthly)
    expect(rule?.startedAt).toBe('2027-01-01T00:00:00Z')
    expect(rule?.targetOngoingBalance).toBe('1000') // kept (method Target)
    expect(rule?.thresholdCredits).toBeNull() // nulled (trigger Interval, not Threshold)

    // Fixed method + Threshold trigger: targetOngoingBalance nulled, interval nulled, threshold kept
    const fixedThreshold = recurringToItem(empty, {
      ...targetInterval,
      method: RecurringTransactionMethodEnum.Fixed,
      trigger: RecurringTransactionTriggerEnum.Threshold,
      thresholdCredits: '20',
    }).recurringRule

    expect(fixedThreshold?.targetOngoingBalance).toBeNull()
    expect(fixedThreshold?.interval).toBeNull()
    expect(fixedThreshold?.startedAt).toBeNull()
    expect(fixedThreshold?.thresholdCredits).toBe('20')
  })
})
