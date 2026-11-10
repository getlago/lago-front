import {
  EditBillingEntityPaymentTermForDialogFragment,
  EditCustomerPaymentTermForDialogFragment,
} from '~/generated/graphql'

export enum PaymentTermModelTypesEnum {
  Customer = 'Customer',
  BillingEntity = 'BillingEntity',
}

export type ModelData =
  EditCustomerPaymentTermForDialogFragment | EditBillingEntityPaymentTermForDialogFragment

export type EditPaymentTermDialogData = {
  model: ModelData | null | undefined
}
