import { UNSUPPORTED_DATE_ERROR } from '~/core/constants/form'
import { CurrencyEnum } from '~/generated/graphql'

import {
  buildCreatePaymentInput,
  buildCreatePaymentValidationSchema,
  CreatePaymentFormValues,
} from '../validationSchema'

const MAX_AMOUNT = 100

const validValues: CreatePaymentFormValues = {
  invoiceId: 'invoice-1',
  amountCents: '50',
  reference: 'my-reference',
  createdAt: '2026-01-15T00:00:00.000Z',
}

const parse = (values: CreatePaymentFormValues, maxAmount = MAX_AMOUNT) =>
  buildCreatePaymentValidationSchema(maxAmount).safeParse(values)

const errorPaths = (values: CreatePaymentFormValues, maxAmount = MAX_AMOUNT): string[] => {
  const result = parse(values, maxAmount)

  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('createPayment/validationSchema', () => {
  describe('GIVEN a fully filled form', () => {
    describe('WHEN the amount is within the invoice due amount', () => {
      it('THEN should accept the values', () => {
        expect(parse(validValues).success).toBe(true)
      })

      it('THEN should accept an amount equal to the due amount', () => {
        expect(parse({ ...validValues, amountCents: '100' }).success).toBe(true)
      })

      it('THEN should accept an amount stored as a number', () => {
        expect(parse({ ...validValues, amountCents: 100 }).success).toBe(true)
      })
    })
  })

  describe('GIVEN a missing invoice', () => {
    it.each([
      ['an empty string', ''],
      ['undefined', undefined],
    ])('THEN should reject %s', (_, invoiceId) => {
      expect(errorPaths({ ...validValues, invoiceId })).toContain('invoiceId')
    })
  })

  describe('GIVEN an amount outside the accepted range', () => {
    it.each([
      ['an empty amount', ''],
      ['an undefined amount', undefined],
      ['a zero amount', '0'],
      ['a negative amount', '-10'],
      ['a non numeric amount', 'abc'],
      ['an amount above the due amount', '100.01'],
    ])('THEN should reject %s', (_, amountCents) => {
      expect(errorPaths({ ...validValues, amountCents })).toContain('amountCents')
    })

    describe('WHEN no invoice is loaded yet', () => {
      it('THEN should reject every amount, as the due amount is 0', () => {
        expect(errorPaths({ ...validValues, amountCents: '1' }, 0)).toContain('amountCents')
      })
    })
  })

  describe('GIVEN a reference', () => {
    it('THEN should reject an empty reference', () => {
      expect(errorPaths({ ...validValues, reference: '' })).toContain('reference')
    })

    it('THEN should accept a 40 characters reference', () => {
      expect(parse({ ...validValues, reference: 'a'.repeat(40) }).success).toBe(true)
    })

    it('THEN should reject a reference longer than 40 characters', () => {
      expect(errorPaths({ ...validValues, reference: 'a'.repeat(41) })).toContain('reference')
    })
  })

  describe('GIVEN a payment date', () => {
    it('THEN should reject a missing date', () => {
      expect(errorPaths({ ...validValues, createdAt: undefined })).toContain('createdAt')
    })

    it('THEN should reject a date below the supported floor with the unsupported date message', () => {
      const result = parse({ ...validValues, createdAt: '1969-12-31T00:00:00.000Z' })

      expect(result.success).toBe(false)
      expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toContain(
        UNSUPPORTED_DATE_ERROR,
      )
    })

    it('THEN should not stack the unsupported date message on a missing date', () => {
      const result = parse({ ...validValues, createdAt: undefined })
      const messages = result.success ? [] : result.error.issues.map((issue) => issue.message)

      expect(messages).not.toContain(UNSUPPORTED_DATE_ERROR)
    })
  })

  describe('GIVEN the API input mapper', () => {
    it('THEN should serialize the amount for the invoice currency', () => {
      expect(buildCreatePaymentInput(validValues, CurrencyEnum.Usd)).toEqual({
        invoiceId: 'invoice-1',
        reference: 'my-reference',
        createdAt: '2026-01-15T00:00:00.000Z',
        amountCents: 5000,
      })
    })
  })
})
