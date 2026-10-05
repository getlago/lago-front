import { PaymentTermFormValues, PaymentTermInheritedFrom } from '~/components/paymentTerms/types'
import { paymentTermFormValuesFromTerm } from '~/components/paymentTerms/utils'
import { DEFAULT_PAYMENT_TERM } from '~/core/constants/paymentTerm'
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
): PaymentTermFormValues => paymentTermFormValuesFromTerm(model?.paymentTerm, canInherit)
