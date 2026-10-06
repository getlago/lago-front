import {
  PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
  PAYMENT_TERM_INHERIT,
} from '~/core/constants/paymentTerm'
import {
  buildPaymentTermInput,
  MaybePaymentTerm,
  ResolvablePaymentTerm,
  resolvePaymentTerm,
} from '~/core/utils/paymentTerm'
import { PaymentTermInput, PaymentTermTypeEnum } from '~/generated/graphql'

import {
  PAYMENT_TERM_FORM_DEFAULT_VALUES,
  PaymentTermFormValues,
  PaymentTermInheritedFrom,
  PaymentTermType,
} from './types'

/** Whether the value stands for a concrete term rather than the inherit choice. */
export const isConcreteTermType = (
  termType: PaymentTermType | undefined,
): termType is PaymentTermTypeEnum => !!termType && termType !== PAYMENT_TERM_INHERIT

/** Turns the form's string-tolerant values into a term the date math can read. */
export const paymentTermFromFormValues = (
  values: PaymentTermFormValues,
): ResolvablePaymentTerm | null => {
  if (!isConcreteTermType(values.termType)) return null

  return {
    termType: values.termType,
    days: values.days === '' ? 0 : Number(values.days),
    dayOfMonth: values.dayOfMonth === '' ? null : Number(values.dayOfMonth),
    monthOffset: values.monthOffset === '' ? null : Number(values.monthOffset),
  }
}

/**
 * Seeds the editor from a stored term. A level without a term of its own starts on the
 * inherit choice when it has a parent to fall back to, and unset otherwise.
 */
export const paymentTermFormValuesFromTerm = (
  paymentTerm: MaybePaymentTerm,
  canInherit: boolean,
): PaymentTermFormValues => {
  if (!paymentTerm) {
    return {
      ...PAYMENT_TERM_FORM_DEFAULT_VALUES,
      termType: canInherit ? PAYMENT_TERM_INHERIT : undefined,
    }
  }

  return {
    termType: paymentTerm.termType,
    days: paymentTerm.days ?? PAYMENT_TERM_FORM_DEFAULT_VALUES.days,
    dayOfMonth: paymentTerm.dayOfMonth ?? PAYMENT_TERM_FORM_DEFAULT_VALUES.dayOfMonth,
    monthOffset: paymentTerm.monthOffset ?? PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
  }
}

/**
 * The mutation payload for the editor's values: only the chosen type's own fields, or
 * `null` for the inherit choice, which clears the override so the level above wins.
 */
export const paymentTermInputFromFormValues = (
  values: PaymentTermFormValues,
): PaymentTermInput | null => {
  const term = paymentTermFromFormValues(values)

  return term ? buildPaymentTermInput(term) : null
}

type CustomerWithPaymentTerm = {
  paymentTerm?: MaybePaymentTerm
  billingEntity?: { paymentTerm?: MaybePaymentTerm } | null
}

/**
 * The inherit choice for a billing object (wallet, one-off invoice): the customer's own
 * term, else its billing entity's, else due on receipt.
 */
export const getInheritedFromCustomer = (
  customer: CustomerWithPaymentTerm | null | undefined,
): PaymentTermInheritedFrom => ({
  term: resolvePaymentTerm({
    ownTerm: customer?.paymentTerm,
    parentTerm: customer?.billingEntity?.paymentTerm,
  }).term,
  labelKey: 'text_17912021395686w9xadhesc3',
})
