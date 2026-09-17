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

const isPositiveIntegerWithin = (value: number | '', min: number, max: number): boolean =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max

/**
 * Mirrors the API's discriminated-union validation: a type's own fields are required and
 * bounded, and nothing else is looked at.
 */
export const paymentTermFormSchema = z
  .object({
    termType: z.union([z.enum(PaymentTermTypeEnum), z.literal(PAYMENT_TERM_INHERIT)], {
      message: 'text_1789042962229hmb871mrfas',
    }),
    days: z.union([z.number(), z.literal('')]),
    dayOfMonth: z.union([z.number(), z.literal('')]),
    monthOffset: z.union([z.number(), z.literal('')]),
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

    if (
      fields.includes('dayOfMonth') &&
      !isPositiveIntegerWithin(
        values.dayOfMonth,
        PAYMENT_TERM_DAY_OF_MONTH_MIN,
        PAYMENT_TERM_DAY_OF_MONTH_MAX,
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['dayOfMonth'],
        message: 'text_1789042962229ojqymcu3289',
      })
    }

    // Absent is valid — the API fills the default — but a value that is present must be in range.
    if (
      fields.includes('monthOffset') &&
      values.monthOffset !== '' &&
      !isPositiveIntegerWithin(
        values.monthOffset,
        PAYMENT_TERM_MONTH_OFFSET_MIN,
        PAYMENT_TERM_MONTH_OFFSET_MAX,
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['monthOffset'],
        message: 'text_1789042962229esmw981wwyt',
      })
    }
  })
