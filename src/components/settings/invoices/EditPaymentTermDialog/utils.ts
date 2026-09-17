import {
  PAYMENT_TERM_FORM_DEFAULT_VALUES,
  PaymentTermFormValues,
  PaymentTermInheritedFrom,
} from '~/components/paymentTerms/types'
import {
  DEFAULT_PAYMENT_TERM,
  PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
  PAYMENT_TERM_INHERIT,
} from '~/core/constants/paymentTerm'
import { EditCustomerPaymentTermForDialogFragment } from '~/generated/graphql'

import { ModelData, PaymentTermModelTypesEnum } from './types'

export const isCustomer = (model: ModelData): model is EditCustomerPaymentTermForDialogFragment =>
  model.__typename === PaymentTermModelTypesEnum.Customer

/**
 * The inherit choice, offered only on a level that has a parent to fall back to. The
 * billing entity is the last level of the chain, so it never gets one.
 */
export const getInheritedFrom = (model: ModelData | null): PaymentTermInheritedFrom | undefined => {
  if (!model || !isCustomer(model)) return undefined

  return {
    term: model.billingEntity?.paymentTerm ?? DEFAULT_PAYMENT_TERM,
    labelKey: 'text_1728374331992d2alok9y3kr',
  }
}

export const getInitialFormValues = (
  model: ModelData | null,
  canInherit: boolean,
): PaymentTermFormValues => {
  const paymentTerm = model?.paymentTerm

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
