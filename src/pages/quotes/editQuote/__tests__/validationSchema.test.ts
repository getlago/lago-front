import { CurrencyEnum } from '~/generated/graphql'

import {
  editQuoteAsideDefaultValues,
  type EditQuoteAsideFormValues,
  editQuoteAsideSchema,
} from '../validationSchema'

const validBase: EditQuoteAsideFormValues = {
  orderTypeLabel: 'Subscription creation',
  billingEntityId: 'be-1',
  currency: CurrencyEnum.Usd,
  subscriptionLabel: 'Premium - ext-sub-1',
}

describe('editQuoteAsideSchema', () => {
  describe('GIVEN valid base values', () => {
    describe('WHEN all required and optional fields are provided', () => {
      it('THEN should pass validation', () => {
        const result = editQuoteAsideSchema.safeParse(validBase)

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN optional fields are omitted', () => {
      it('THEN should pass validation', () => {
        const result = editQuoteAsideSchema.safeParse({
          orderTypeLabel: 'One-off',
          billingEntityId: 'be-2',
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('GIVEN the billing entity is left to the customer', () => {
    describe('WHEN billingEntityId is the empty inherit sentinel', () => {
      it('THEN should pass validation', () => {
        const result = editQuoteAsideSchema.safeParse({ ...validBase, billingEntityId: '' })

        expect(result.success).toBe(true)
      })
    })

    describe('WHEN billingEntityId is missing entirely', () => {
      it('THEN should fail, because the field always holds a string', () => {
        const result = editQuoteAsideSchema.safeParse({ orderTypeLabel: 'One-off' })

        expect(result.success).toBe(false)
      })
    })
  })

  describe('GIVEN the currency', () => {
    describe('WHEN it is not a known currency', () => {
      it('THEN should fail validation', () => {
        const result = editQuoteAsideSchema.safeParse({ ...validBase, currency: 'NOT_A_CURRENCY' })

        expect(result.success).toBe(false)
      })
    })
  })

  describe('GIVEN the quote-level dates dropped by the API', () => {
    describe('WHEN startDate and endDate are supplied', () => {
      it('THEN should ignore them instead of validating a range', () => {
        const result = editQuoteAsideSchema.safeParse({
          ...validBase,
          startDate: '2026-12-01T00:00:00Z',
          endDate: '2026-01-01T00:00:00Z',
        })

        expect(result.success).toBe(true)

        if (result.success) {
          expect(result.data).not.toHaveProperty('startDate')
          expect(result.data).not.toHaveProperty('endDate')
        }
      })
    })
  })
})

describe('editQuoteAsideDefaultValues', () => {
  describe('GIVEN the default values export', () => {
    describe('WHEN inspected', () => {
      it('THEN should have empty strings for required fields and undefined for optional fields', () => {
        expect(editQuoteAsideDefaultValues).toEqual({
          orderTypeLabel: '',
          billingEntityId: '',
          currency: undefined,
          subscriptionLabel: undefined,
        })
      })
    })

    describe('WHEN parsed by the schema', () => {
      it('THEN should pass validation', () => {
        const result = editQuoteAsideSchema.safeParse(editQuoteAsideDefaultValues)

        expect(result.success).toBe(true)
      })
    })
  })
})
