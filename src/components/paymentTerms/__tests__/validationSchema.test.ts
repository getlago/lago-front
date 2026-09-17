import { PAYMENT_TERM_INHERIT } from '~/core/constants/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'

import { PAYMENT_TERM_FORM_DEFAULT_VALUES, PaymentTermFormValues } from '../types'
import { paymentTermFormSchema } from '../validationSchema'

const TERM_TYPE_REQUIRED = 'text_1789042962229hmb871mrfas'
const DAYS_INVALID = 'text_1789042962229bk0kdnqlbpc'
const DAY_OF_MONTH_INVALID = 'text_1789042962229ojqymcu3289'
const MONTH_OFFSET_INVALID = 'text_1789042962229esmw981wwyt'

const values = (overrides: Partial<PaymentTermFormValues> = {}): PaymentTermFormValues => ({
  ...PAYMENT_TERM_FORM_DEFAULT_VALUES,
  ...overrides,
})

const errorsOf = (input: unknown): { path: string; message: string }[] => {
  const result = paymentTermFormSchema.safeParse(input)

  if (result.success) return []

  return result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

describe('paymentTermFormSchema', () => {
  describe('GIVEN no term type', () => {
    describe('WHEN validating', () => {
      it('THEN should report the required term type', () => {
        // Without this the dialog submits an empty term and the button spins with no error.
        expect(errorsOf(values({ termType: undefined }))).toEqual([
          { path: 'termType', message: TERM_TYPE_REQUIRED },
        ])
      })
    })
  })

  describe('GIVEN the inherit choice', () => {
    describe('WHEN validating', () => {
      it('THEN should report no error and skip the numeric rules', () => {
        expect(
          errorsOf(values({ termType: PAYMENT_TERM_INHERIT, days: '', dayOfMonth: '' })),
        ).toEqual([])
      })
    })
  })

  describe('GIVEN a type that carries no numeric field', () => {
    describe('WHEN its unrelated fields are blank', () => {
      it('THEN should report no error', () => {
        expect(
          errorsOf(
            values({ termType: PaymentTermTypeEnum.DueOnReceipt, days: '', dayOfMonth: '' }),
          ),
        ).toEqual([])
      })
    })
  })

  describe.each([
    PaymentTermTypeEnum.Net,
    PaymentTermTypeEnum.NetEndOfMonth,
    PaymentTermTypeEnum.DaysEndOfMonth,
  ])('GIVEN a %s term', (termType) => {
    describe('WHEN days is blank', () => {
      it('THEN should report the days error', () => {
        expect(errorsOf(values({ termType, days: '' }))).toEqual([
          { path: 'days', message: DAYS_INVALID },
        ])
      })
    })

    describe('WHEN days is zero', () => {
      it('THEN should report no error', () => {
        expect(errorsOf(values({ termType, days: 0 }))).toEqual([])
      })
    })
  })

  describe('GIVEN a day of month term', () => {
    const dayOfMonthTerm = (overrides: Partial<PaymentTermFormValues> = {}) =>
      values({ termType: PaymentTermTypeEnum.DayOfMonth, ...overrides })

    describe.each([0, 32])('WHEN the day of month is %s', (dayOfMonth) => {
      it('THEN should report the day of month error', () => {
        expect(errorsOf(dayOfMonthTerm({ dayOfMonth }))).toEqual([
          { path: 'dayOfMonth', message: DAY_OF_MONTH_INVALID },
        ])
      })
    })

    describe('WHEN the month offset is out of range', () => {
      it('THEN should report the month offset error', () => {
        expect(errorsOf(dayOfMonthTerm({ monthOffset: 13 }))).toEqual([
          { path: 'monthOffset', message: MONTH_OFFSET_INVALID },
        ])
      })
    })

    describe('WHEN the month offset is blank', () => {
      it('THEN should report no error', () => {
        // The API fills its own default when the field is absent.
        expect(errorsOf(dayOfMonthTerm({ monthOffset: '' }))).toEqual([])
      })
    })
  })
})
