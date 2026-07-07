import { makeEmptyWalletItem } from '~/core/serializers/serializeQuoteWallets'

import {
  isWalletItemPersistable,
  itemToRecurring,
  recurringToItem,
  topUpWithinLimits,
  walletSettingsSchema,
} from '../walletFormSchema'

describe('walletFormSchema', () => {
  it('rejects settings with priority above 50', () => {
    const result = walletSettingsSchema.safeParse({
      name: '',
      rateAmount: '1',
      priority: 51,
      expirationAt: null,
      paidTopUpMinAmountCents: null,
      paidTopUpMaxAmountCents: null,
      purchaseOrderNumber: null,
    })

    expect(result.success).toBe(false)
  })

  it('rejects settings where min > max', () => {
    const result = walletSettingsSchema.safeParse({
      name: '',
      rateAmount: '1',
      priority: 1,
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
})
