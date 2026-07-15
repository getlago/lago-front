import {
  CurrencyEnum,
  FeeTypesEnum,
  RecurringTransactionIntervalEnum,
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'

import { mergeWalletCredits } from '../serializeQuoteBillingItems'
import {
  type BillingItemWallet,
  fromWallets,
  toWallets,
  type WalletFormItem,
} from '../serializeQuoteWallets'

const baseItem: WalletFormItem = {
  localId: 'wl_1',
  name: 'Monthly usage credits',
  rateAmount: '1.5',
  priority: 1,
  expirationAt: '2027-03-31T23:59:59Z',
  paidTopUpMinAmountCents: null,
  paidTopUpMaxAmountCents: null,
  purchaseOrderNumber: null,
  feeTypes: [FeeTypesEnum.Charge],
  billableMetricCodes: ['cpu', 'storage'],
  freeCredits: '500.0',
  paidCredits: '500.0',
  invoiceRequiresSuccessfulPayment: false,
  metadata: [],
  recurringRule: {
    trigger: RecurringTransactionTriggerEnum.Interval,
    method: RecurringTransactionMethodEnum.Target,
    interval: RecurringTransactionIntervalEnum.Monthly,
    paidCredits: '500.0',
    grantedCredits: '500.0',
    targetOngoingBalance: '1000.0',
    thresholdCredits: null,
    startedAt: null,
    transactionName: null,
    invoiceRequiresSuccessfulPayment: false,
    expirationAt: null,
  },
}

describe('serializeQuoteWallets', () => {
  it('toWallets maps a form item into the wallet_credit envelope with overrides + position', () => {
    const [entry] = toWallets([baseItem], CurrencyEnum.Eur)

    expect(entry.type).toBe('wallet_credit')
    expect(entry.localId).toBe('wl_1')
    expect(entry.overrides.position).toBe(1)
    expect(entry.overrides.currency).toBe('EUR')
    expect(entry.overrides.rate_amount).toBe('1.5')
    expect(entry.overrides.granted_credits).toBe('500.0')
    expect(entry.overrides.paid_credits).toBe('500.0')
    expect(entry.overrides.applies_to).toEqual({
      fee_types: ['charge'],
      billable_metric_codes: ['cpu', 'storage'],
    })
    expect(entry.overrides.recurring_transaction_rules).toHaveLength(1)
    expect(entry.overrides.recurring_transaction_rules[0].target_ongoing_balance).toBe('1000.0')
  })

  it('toWallets emits no recurring rules when recurringRule is null', () => {
    const [entry] = toWallets([{ ...baseItem, recurringRule: null }], CurrencyEnum.Eur)

    expect(entry.overrides.recurring_transaction_rules).toEqual([])
  })

  it('fromWallets is the inverse of toWallets (round-trip preserves localId + fields)', () => {
    const wallets = toWallets([baseItem], CurrencyEnum.Eur)
    const { walletItems, entities } = fromWallets(wallets)

    expect(walletItems).toHaveLength(1)
    expect(walletItems[0].localId).toBe('wl_1')
    expect(walletItems[0].name).toBe('Monthly usage credits')
    expect(walletItems[0].rateAmount).toBe('1.5')
    expect(walletItems[0].billableMetricCodes).toEqual(['cpu', 'storage'])
    expect(walletItems[0].recurringRule?.method).toBe(RecurringTransactionMethodEnum.Target)
    expect(entities['wl_1']).toMatchObject({ entityId: 'wl_1', entityType: 'wallet' })
  })

  it('fromWallets re-derives ascending positions by stored position', () => {
    const a: BillingItemWallet = toWallets([{ ...baseItem, localId: 'wl_a' }], CurrencyEnum.Eur)[0]
    const b: BillingItemWallet = toWallets([{ ...baseItem, localId: 'wl_b' }], CurrencyEnum.Eur)[0]

    b.overrides.position = 1
    a.overrides.position = 2

    const { walletItems } = fromWallets([a, b])

    expect(walletItems.map((w) => w.localId)).toEqual(['wl_b', 'wl_a'])
  })
})

describe('mergeWalletCredits — never drops sibling categories', () => {
  const siblings = {
    plans: [{ type: 'plan' }],
    addOns: [{ type: 'add_on' }],
    coupons: [{ type: 'coupon' }],
  } as never

  it('replaces only walletCredits when creating/editing a wallet', () => {
    const walletCredits = toWallets([baseItem], CurrencyEnum.Eur)
    const result = mergeWalletCredits(siblings, walletCredits)

    expect(result.walletCredits).toHaveLength(1)
    expect(result.plans).toEqual((siblings as { plans: unknown }).plans)
    expect(result.addOns).toEqual((siblings as { addOns: unknown }).addOns)
    expect(result.coupons).toEqual((siblings as { coupons: unknown }).coupons)
  })

  it('replaces only walletCredits when deleting all wallets (empty array)', () => {
    const result = mergeWalletCredits(
      { ...(siblings as object), walletCredits: toWallets([baseItem], CurrencyEnum.Eur) },
      [],
    )

    expect(result.walletCredits).toEqual([])
    expect(result.plans).toEqual((siblings as { plans: unknown }).plans)
    expect(result.addOns).toEqual((siblings as { addOns: unknown }).addOns)
    expect(result.coupons).toEqual((siblings as { coupons: unknown }).coupons)
  })

  it('tolerates null/undefined billingItems', () => {
    expect(mergeWalletCredits(null, []).walletCredits).toEqual([])
    expect(mergeWalletCredits(undefined, []).plans).toBeUndefined()
  })
})
