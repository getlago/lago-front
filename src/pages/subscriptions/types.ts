import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { CreateSubscriptionInput } from '~/generated/graphql'

export type SubscriptionFormInput = Omit<
  CreateSubscriptionInput,
  'customerId' | 'paymentMethod'
> & {
  paymentMethod?: SelectedPaymentMethod
  invoiceCustomSection?: InvoiceCustomSectionInput
}
