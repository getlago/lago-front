import { PaymentTermFormValues, PaymentTermInheritedFrom } from '~/components/paymentTerms/types'
import {
  getInheritedPaymentTerm,
  paymentTermFormValuesFromTerm,
} from '~/components/paymentTerms/utils'
import { EditCustomerPaymentTermForDialogFragment } from '~/generated/graphql'

import { ModelData, PaymentTermModelTypesEnum } from './types'

export const isCustomer = (model: ModelData): model is EditCustomerPaymentTermForDialogFragment =>
  model.__typename === PaymentTermModelTypesEnum.Customer

// The customer's own term is the one being edited, so only its billing entity is a level above.
export const getInheritedFrom = (model: ModelData | null): PaymentTermInheritedFrom | undefined => {
  if (!model || !isCustomer(model)) return undefined

  return getInheritedPaymentTerm({ customer: { billingEntity: model.billingEntity } })
}

export const getInitialFormValues = (
  model: ModelData | null,
  canInherit: boolean,
): PaymentTermFormValues => paymentTermFormValuesFromTerm(model?.paymentTerm, canInherit)
