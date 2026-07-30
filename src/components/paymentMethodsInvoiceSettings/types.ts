import { InvoiceFormInput } from '~/components/invoices/types'
import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { CreateCustomerWalletTransactionInput, Customer } from '~/generated/graphql'
import { SubscriptionFormInput } from '~/pages/subscriptions/types'
import { TWalletDataForm } from '~/pages/wallet/types'

type FormTypeMap = {
  [ViewTypeEnum.Subscription]: SubscriptionFormInput
  [ViewTypeEnum.WalletTopUp]: TWalletDataForm
  [ViewTypeEnum.WalletRecurringTopUp]: TWalletDataForm
  [ViewTypeEnum.WalletTransactionTopUp]: Omit<CreateCustomerWalletTransactionInput, 'walletId'>
  [ViewTypeEnum.OneOffInvoice]: InvoiceFormInput
}

type CustomerForPaymentMethods = Partial<Pick<Customer, 'id' | 'externalId'>> | null | undefined

export interface PaymentMethodsForm<T extends ViewTypeEnum = ViewTypeEnum> {
  values: Partial<FormTypeMap[T]>
  setFieldValue(field: string, value: unknown): unknown
}

// Shared by both single-purpose settings components and the composite — they
// only differ in which child (and customer field) they render.
export interface SettingsComponentProps<T extends ViewTypeEnum = ViewTypeEnum> {
  customer: CustomerForPaymentMethods
  form: PaymentMethodsForm<T>
  viewType: T
  formFieldBasePath?: string
}
