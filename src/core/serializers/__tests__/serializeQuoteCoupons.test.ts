import { CouponFrequency, CouponTypeEnum, CurrencyEnum } from '~/generated/graphql'

import {
  type BillingItemCoupon,
  type DiscountFormItem,
  fromCoupons,
  toCoupons,
} from '../serializeQuoteCoupons'

const fixedPayload = {
  position: 1,
  code: 'enterprise_discount_20',
  id: 'cpn_uuid',
  name: 'Enterprise 20% Discount',
  type: 'fixed_amount' as const,
  amountCents: 5000,
  percentageRate: null,
  currency: 'EUR',
  frequency: 'recurring' as const,
  frequencyDuration: 6,
  expirationAt: null,
  limitedPlans: false,
  planCodes: [],
  limitedBillableMetrics: false,
  billableMetricCodes: [],
  couponOverrides: null,
  catalogSnapshot: null,
  resolvedPayload: null,
}

describe('serializeQuoteCoupons', () => {
  describe('toCoupons', () => {
    it('writes the full UI-editable set into overrides (fixed amount)', () => {
      const items: DiscountFormItem[] = [
        {
          localId: 'local-1',
          couponId: 'cpn_uuid',
          couponType: CouponTypeEnum.FixedAmount,
          name: 'Enterprise 20% Discount',
          code: 'enterprise_discount_20',
          currency: CurrencyEnum.Eur,
          amount: '90.00',
          percentageRate: null,
          frequency: CouponFrequency.Recurring,
          frequencyDuration: 6,
        },
      ]

      const result = toCoupons(items, { 'local-1': fixedPayload })

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('coupon')
      expect(result[0].id).toBe('cpn_uuid')
      expect(result[0].localId).toBe('local-1')
      expect(result[0].overrides).toEqual({
        amountCents: 9000,
        amountCurrency: CurrencyEnum.Eur,
        percentageRate: null,
        frequency: 'recurring',
        frequencyDuration: 6,
      })
      // currency is NOT in overrides
      expect(result[0].overrides).not.toHaveProperty('currency')
    })

    it('writes percentageRate (amountCents null) for percentage coupons', () => {
      const items: DiscountFormItem[] = [
        {
          localId: 'local-2',
          couponId: 'cpn_pct',
          couponType: CouponTypeEnum.Percentage,
          name: 'Pct',
          code: 'pct',
          currency: CurrencyEnum.Eur,
          amount: '',
          percentageRate: 12.5,
          frequency: CouponFrequency.Forever,
          frequencyDuration: null,
        },
      ]

      const result = toCoupons(items, {
        'local-2': {
          ...fixedPayload,
          id: 'cpn_pct',
          type: 'percentage',
          amountCents: null,
          percentageRate: 10,
        },
      })

      expect(result[0].overrides).toEqual({
        amountCents: null,
        amountCurrency: null,
        percentageRate: 12.5,
        frequency: 'forever',
        frequencyDuration: null,
      })
    })
  })

  describe('fromCoupons', () => {
    it('round-trips a saved coupon into a form item keyed by localId, overrides winning', () => {
      const saved: BillingItemCoupon[] = [
        {
          type: 'coupon',
          id: 'cpn_uuid',
          localId: 'local-1',
          payload: fixedPayload,
          overrides: {
            amountCents: 9000,
            amountCurrency: null,
            percentageRate: null,
            frequency: CouponFrequency.Recurring,
            frequencyDuration: 6,
          },
        },
      ]

      const { entities, discountItems, originalPayloads } = fromCoupons(saved)

      expect(discountItems[0].couponId).toBe('cpn_uuid')
      expect(discountItems[0].amount).toBe('90') // 9000 cents / EUR, no trailing .00
      expect(discountItems[0].frequency).toBe(CouponFrequency.Recurring)
      expect(entities['local-1'].entityType).toBe('coupon')
      expect(entities['local-1'].name).toBe('Enterprise 20% Discount')
      expect(originalPayloads['local-1']).toEqual(fixedPayload)
    })
  })

  describe('repricing a fixed-amount coupon in the deal currency', () => {
    // `payload.currency` is the catalog coupon's own and stays that way, so without a currency in
    // the overrides a coupon priced elsewhere is unusable on the deal.
    const items = [
      {
        localId: 'local-1',
        couponId: 'cpn_uuid',
        couponType: CouponTypeEnum.FixedAmount,
        name: 'Enterprise discount',
        code: 'enterprise_discount_20',
        currency: CurrencyEnum.Eur,
        amount: '90.00',
        percentageRate: null,
        frequency: CouponFrequency.Once,
        frequencyDuration: null,
      },
    ]

    it('records the deal currency and prices the amount in it', () => {
      const result = toCoupons(items, { 'local-1': fixedPayload }, CurrencyEnum.Aud)

      expect(result[0].overrides.amountCurrency).toBe(CurrencyEnum.Aud)
      expect(result[0].overrides.amountCents).toBe(9000)
    })

    it('leaves the catalog currency untouched in the payload', () => {
      const result = toCoupons(items, { 'local-1': fixedPayload }, CurrencyEnum.Aud)

      expect(result[0].payload.currency).toBe(fixedPayload.currency)
    })

    it('falls back to the form currency when no deal currency is given', () => {
      const result = toCoupons(items, { 'local-1': fixedPayload })

      expect(result[0].overrides.amountCurrency).toBe(CurrencyEnum.Eur)
    })

    it('reads the amount back in the deal currency, not the catalog one', () => {
      const serialized = toCoupons(items, { 'local-1': fixedPayload }, CurrencyEnum.Aud)
      const { discountItems } = fromCoupons(serialized, CurrencyEnum.Aud)

      expect(discountItems[0].currency).toBe(CurrencyEnum.Aud)
      expect(discountItems[0].amount).toBe('90')
    })

    it('reopens in the deal currency even when the stored override is stale', () => {
      const serialized = toCoupons(items, { 'local-1': fixedPayload }, CurrencyEnum.Eur)
      const { discountItems } = fromCoupons(serialized, CurrencyEnum.Aud)

      expect(discountItems[0].currency).toBe(CurrencyEnum.Aud)
    })
  })
})
