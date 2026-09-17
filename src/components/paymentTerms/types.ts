import {
  PAYMENT_TERM_DAY_OF_MONTH_MIN,
  PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
  PAYMENT_TERM_INHERIT,
} from '~/core/constants/paymentTerm'
import { ResolvablePaymentTerm } from '~/core/utils/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'

export type PaymentTermType = PaymentTermTypeEnum | typeof PAYMENT_TERM_INHERIT

/** The term a level would fall back to, and the label naming the level it comes from. */
export type PaymentTermInheritedFrom = { term: ResolvablePaymentTerm; labelKey: string }

export type PaymentTermFormValues = {
  termType: PaymentTermType | undefined
  days: number | ''
  dayOfMonth: number | ''
  monthOffset: number | ''
}

/**
 * `termType` starts out unset, so a level with no term of its own and nothing to inherit
 * from reports a required-field error instead of submitting an empty term. A level that
 * can inherit is seeded with `PAYMENT_TERM_INHERIT` by its caller.
 *
 * The numeric fields are seeded rather than left blank so that switching term type
 * reveals a usable value straight away. Values belonging to a type the user moved away
 * from are simply not sent: `buildPaymentTermInput` emits only the chosen type's fields.
 */
export const PAYMENT_TERM_FORM_DEFAULT_VALUES: PaymentTermFormValues = {
  termType: undefined,
  days: 0,
  dayOfMonth: PAYMENT_TERM_DAY_OF_MONTH_MIN,
  monthOffset: PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
}
