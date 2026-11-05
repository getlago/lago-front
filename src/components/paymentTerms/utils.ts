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

// Without a term of its own, a level starts on inherit if it has a parent, else unset.
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
    days: String(paymentTerm.days ?? PAYMENT_TERM_FORM_DEFAULT_VALUES.days),
    dayOfMonth: String(paymentTerm.dayOfMonth ?? PAYMENT_TERM_FORM_DEFAULT_VALUES.dayOfMonth),
    monthOffset: String(paymentTerm.monthOffset ?? PAYMENT_TERM_DEFAULT_MONTH_OFFSET),
  }
}

// `null` (the inherit choice) clears the override so the level above wins.
export const paymentTermInputFromFormValues = (
  values: PaymentTermFormValues,
): PaymentTermInput | null => {
  const term = paymentTermFromFormValues(values)

  return term ? buildPaymentTermInput(term) : null
}

type BillingEntityWithPaymentTerm = { paymentTerm?: MaybePaymentTerm } | null | undefined

/** The levels above a billing object (subscription, wallet, one-off invoice). */
export type PaymentTermLevels = {
  customer:
    | { paymentTerm?: MaybePaymentTerm; billingEntity?: BillingEntityWithPaymentTerm }
    | null
    | undefined
  issuingBillingEntity?: BillingEntityWithPaymentTerm
}

export const INHERIT_FROM_CUSTOMER_LABEL_KEY = 'text_17912021395686w9xadhesc3'
export const INHERIT_FROM_BILLING_ENTITY_LABEL_KEY = 'text_1728374331992d2alok9y3kr'

export const getInheritedPaymentTerm = ({
  customer,
  issuingBillingEntity,
}: PaymentTermLevels): PaymentTermInheritedFrom => {
  const { term } = resolvePaymentTerm({
    ownTerm: customer?.paymentTerm,
    parentTerm: (issuingBillingEntity ?? customer?.billingEntity)?.paymentTerm,
  })

  return {
    term,
    labelKey: customer?.paymentTerm
      ? INHERIT_FROM_CUSTOMER_LABEL_KEY
      : INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
  }
}
