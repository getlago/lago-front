import { InvoiceSubscription } from '~/generated/graphql'

import {
  chargeZeroAmount,
  chargeZeroAmountDraftInvoice,
  chargeZeroAmountDraftInvoiceResult,
  noFees,
  noFeesResult,
  oneSubscription,
  oneSubscriptionResult,
  orderedSubscriptionWithFees,
  subZeroAmount,
  subZeroAmountResult,
  twoSubscriptions,
  twoSubscriptionsResult,
  unorderedSubscriptionWithFees,
} from './fixture'

import {
  getSubscriptionFeeDisplayName,
  groupAndFormatFees,
  TExtendedRemainingFee,
} from '../formatInvoiceItemsMap'

describe('formatInvoiceItemsMap', () => {
  describe('getSubscriptionFeeDisplayName', () => {
    it('should return the plan name formated by default', () => {
      const fee = {
        invoiceDisplayName: null,
        subscription: {
          plan: {
            name: 'Plan name',
            interval: 'monthly',
          },
        },
      }

      const result = getSubscriptionFeeDisplayName(fee as TExtendedRemainingFee)

      expect(result).toEqual('Monthly subscription fee - Plan name')
    })

    it('should return the invoiceDisplayName if it exists', () => {
      const fee = {
        invoiceDisplayName: 'Custom invoice display name',
        subscription: {
          plan: {
            interval: 'monthly',
          },
        },
      }

      const result = getSubscriptionFeeDisplayName(fee as TExtendedRemainingFee)

      expect(result).toEqual('Custom invoice display name')
    })
  })

  describe('groupAndFormatFees', () => {
    it('should return default values if there are no data', () => {
      const result = groupAndFormatFees([])

      expect(result).toEqual({
        subscriptions: {},
        metadata: { hasAnyFeeParsed: false, hasAnyPositiveFeeParsed: false },
      })
    })
    it('should return default values if there are no fees', () => {
      const result = groupAndFormatFees(noFees as unknown as InvoiceSubscription[])

      expect(result).toEqual(noFeesResult)
    })
    it('should return default values if there are only sub fee with 0 amountCents', () => {
      const result = groupAndFormatFees(subZeroAmount as unknown as InvoiceSubscription[])

      expect(result).toEqual(subZeroAmountResult)
    })
    it('should return default values if there are only sub fee with 0 amountCents and 0 units', () => {
      const result = groupAndFormatFees(chargeZeroAmount as unknown as InvoiceSubscription[])

      expect(result).toEqual(noFeesResult)
    })
    it('should return all values if invoice has draft status', () => {
      const result = groupAndFormatFees(
        chargeZeroAmountDraftInvoice as unknown as InvoiceSubscription[],
      )

      expect(result).toEqual(chargeZeroAmountDraftInvoiceResult)
    })
    it('should return the correct values if there are 1 subscription', () => {
      const result = groupAndFormatFees(oneSubscription as unknown as InvoiceSubscription[])

      expect(result).toEqual(oneSubscriptionResult)
    })
    it('should return the correct values if there are 2 subscription', () => {
      const result = groupAndFormatFees(twoSubscriptions as unknown as InvoiceSubscription[])

      expect(result).toEqual(twoSubscriptionsResult)
    })
    it('should return the correct order for a given subscription', () => {
      const result = groupAndFormatFees(
        unorderedSubscriptionWithFees as unknown as InvoiceSubscription[],
      )

      expect(result).toEqual(orderedSubscriptionWithFees)
    })
  })
})
