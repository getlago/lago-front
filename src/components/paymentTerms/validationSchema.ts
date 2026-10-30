import { z } from 'zod'

import {
  PAYMENT_TERM_DAY_OF_MONTH_MAX,
  PAYMENT_TERM_DAY_OF_MONTH_MIN,
  PAYMENT_TERM_FIELDS_BY_TYPE,
  PAYMENT_TERM_INHERIT,
  PAYMENT_TERM_MONTH_OFFSET_MAX,
  PAYMENT_TERM_MONTH_OFFSET_MIN,
} from '~/core/constants/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'

import { isConcreteTermType } from './utils'

const isPositiveIntegerWithin = (value: string, min: number, max: number): boolean =>
  /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max

export const isDayOfMonthValid = (value: string): boolean =>
  isPositiveIntegerWithin(value, PAYMENT_TERM_DAY_OF_MONTH_MIN, PAYMENT_TERM_DAY_OF_MONTH_MAX)

/** Blank is valid: the API fills its own default when the offset is absent. */
export const isMonthOffsetValid = (value: string): boolean =>
  value === '' ||
  isPositiveIntegerWithin(value, PAYMENT_TERM_MONTH_OFFSET_MIN, PAYMENT_TERM_MONTH_OFFSET_MAX)

/**
 * Mirrors the API's discriminated-union validation: a type's own fields are required and
 * bounded, and nothing else is looked at.
 */
export const paymentTermFormSchema = z
  .object({
    termType: z.union([z.enum(PaymentTermTypeEnum), z.literal(PAYMENT_TERM_INHERIT)], {
      message: 'text_1789042962229hmb871mrfas',
    }),
    days: z.string(),
    dayOfMonth: z.string(),
    monthOffset: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!isConcreteTermType(values.termType)) return

    const fields = PAYMENT_TERM_FIELDS_BY_TYPE[values.termType]

    if (
      fields.includes('days') &&
      !isPositiveIntegerWithin(values.days, 0, Number.MAX_SAFE_INTEGER)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['days'],
        message: 'text_1789042962229bk0kdnqlbpc',
      })
    }

    if (fields.includes('dayOfMonth') && !isDayOfMonthValid(values.dayOfMonth)) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfMonth'],
        message: 'text_1789042962229ojqymcu3289',
      })
    }

    if (fields.includes('monthOffset') && !isMonthOffsetValid(values.monthOffset)) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthOffset'],
        message: 'text_1789042962229esmw981wwyt',
      })
    }
  })

/** Reports the editor's issues from inside a larger form's schema, under `path`. */
export const addPaymentTermIssues = (
  ctx: z.RefinementCtx,
  values: unknown,
  path: (string | number)[],
) => {
  const parsed = paymentTermFormSchema.safeParse(values)

  if (parsed.success) return

  parsed.error.issues.forEach((issue) => {
    ctx.addIssue({ code: 'custom', message: issue.message, path: [...path, ...issue.path] })
  })
}
