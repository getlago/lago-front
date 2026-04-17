import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { CreateSubscriptionInput } from '~/generated/graphql'

export enum ActivationRuleFormEnum {
  Immediately = 'immediately',
  OnPayment = 'on_payment',
}

export type SubscriptionFormInput = Omit<
  CreateSubscriptionInput,
  'customerId' | 'paymentMethod' | 'activationRules'
> & {
  paymentMethod?: SelectedPaymentMethod
  invoiceCustomSection?: InvoiceCustomSectionInput
  activationRuleType: ActivationRuleFormEnum
  activationRuleTimeoutHours: string
}
