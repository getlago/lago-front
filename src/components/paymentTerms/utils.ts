import { PAYMENT_TERM_INHERIT } from '~/core/constants/paymentTerm'
import { ResolvablePaymentTerm } from '~/core/utils/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'

import { PaymentTermFormValues, PaymentTermType } from './types'

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
