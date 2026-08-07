import { CurrencyEnum, OrderTypeEnum } from '~/generated/graphql'

import { createQuoteSchema } from '../validationSchema'

describe('createQuoteSchema', () => {
  describe('GIVEN a complete payload', () => {
    describe.each([
      ['one_off', OrderTypeEnum.OneOff, ''],
      ['subscription_creation', OrderTypeEnum.SubscriptionCreation, ''],
      ['subscription_amendment', OrderTypeEnum.SubscriptionAmendment, 'sub-456'],
    ])('WHEN the order type is %s', (_, orderType, subscriptionId) => {
      it('THEN should pass validation', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType,
          subscriptionId,
          currency: CurrencyEnum.Usd,
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN owners are provided', () => {
      it('THEN should pass validation', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType: OrderTypeEnum.OneOff,
          subscriptionId: '',
          currency: CurrencyEnum.Usd,
          owners: [{ value: 'user-1' }, { value: 'user-2' }],
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN owners are omitted', () => {
      it('THEN should pass validation (optional field)', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType: OrderTypeEnum.OneOff,
          subscriptionId: '',
          currency: CurrencyEnum.Usd,
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN the customerId field', () => {
    describe('WHEN customerId is empty', () => {
      it('THEN should fail validation on the customerId path', () => {
        const result = createQuoteSchema.safeParse({
          customerId: '',
          orderType: OrderTypeEnum.OneOff,
          subscriptionId: '',
          currency: CurrencyEnum.Usd,
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues[0].path).toContain('customerId')
        }
      })
    })
  })

  describe('GIVEN the subscriptionId field', () => {
    describe('WHEN a subscription_amendment has no subscriptionId', () => {
      it('THEN should fail validation on the subscriptionId path', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType: OrderTypeEnum.SubscriptionAmendment,
          subscriptionId: '',
          currency: CurrencyEnum.Usd,
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const paths = result.error.issues.map((issue) => issue.path).flat()

          expect(paths).toContain('subscriptionId')
        }
      })
    })

    describe.each([
      ['one_off', OrderTypeEnum.OneOff],
      ['subscription_creation', OrderTypeEnum.SubscriptionCreation],
    ])('WHEN the order type is %s without a subscriptionId', (_, orderType) => {
      it('THEN should pass validation', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType,
          subscriptionId: '',
          currency: CurrencyEnum.Usd,
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN the currency field', () => {
    describe('WHEN a valid CurrencyEnum value is provided', () => {
      it('THEN should pass validation', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType: OrderTypeEnum.OneOff,
          subscriptionId: '',
          currency: CurrencyEnum.Usd,
        })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN currency is omitted', () => {
      it('THEN should fail validation on the currency path', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType: OrderTypeEnum.OneOff,
          subscriptionId: '',
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const paths = result.error.issues.map((issue) => issue.path).flat()

          expect(paths).toContain('currency')
        }
      })
    })

    describe('WHEN currency is undefined', () => {
      it('THEN should fail validation on the currency path', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType: OrderTypeEnum.OneOff,
          subscriptionId: '',
          currency: undefined,
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const paths = result.error.issues.map((issue) => issue.path).flat()

          expect(paths).toContain('currency')
        }
      })
    })

    describe('WHEN an invalid currency value is provided', () => {
      it('THEN should fail validation', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType: OrderTypeEnum.OneOff,
          subscriptionId: '',
          currency: 'INVALID_CURRENCY',
        })

        expect(result.success).toBe(false)
      })
    })
  })

  describe('GIVEN a subscription_amendment missing both subscriptionId and currency', () => {
    describe('WHEN the payload is parsed', () => {
      it('THEN should report both paths', () => {
        const result = createQuoteSchema.safeParse({
          customerId: 'customer-123',
          orderType: OrderTypeEnum.SubscriptionAmendment,
          subscriptionId: '',
        })

        expect(result.success).toBe(false)

        if (!result.success) {
          const paths = result.error.issues.map((issue) => issue.path).flat()

          expect(paths).toContain('subscriptionId')
          expect(paths).toContain('currency')
        }
      })
    })
  })
})
