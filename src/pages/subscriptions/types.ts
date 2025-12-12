import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { CreateSubscriptionInput } from '~/generated/graphql'

export type SubscriptionFormInput = Omit<CreateSubscriptionInput, 'customerId'> & {
  invoiceCustomSection: InvoiceCustomSectionInput
}
