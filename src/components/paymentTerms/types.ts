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
  days: string
  dayOfMonth: string
  monthOffset: string
}

/** Binds `PaymentTermFormContent` to a form whose values are the term itself. */
export const PAYMENT_TERM_FORM_TOP_LEVEL_FIELDS = {
  termType: 'termType',
  days: 'days',
  dayOfMonth: 'dayOfMonth',
  monthOffset: 'monthOffset',
} as const

// `termType` is unset so a level with nothing to inherit reports a required-field error.
export const PAYMENT_TERM_FORM_DEFAULT_VALUES: PaymentTermFormValues = {
  termType: undefined,
  days: '0',
  dayOfMonth: String(PAYMENT_TERM_DAY_OF_MONTH_MIN),
  monthOffset: String(PAYMENT_TERM_DEFAULT_MONTH_OFFSET),
}
