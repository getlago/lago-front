import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import {
  CreateCustomerWalletInput,
  UpdateCustomerWalletInput,
  WalletForScopeSectionFragment,
} from '~/generated/graphql'

export type TWalletDataForm = Omit<CreateCustomerWalletInput, 'customerId' | 'name' | 'code'> &
  Omit<UpdateCustomerWalletInput, 'id' | 'name' | 'code'> & {
    // Always strings in the form ('' when unset) so they stay compatible
    // with NameAndCodeGroup's field mapping.
    name: string
    code: string
    appliesTo?: WalletForScopeSectionFragment['appliesTo']
    paymentMethod?: SelectedPaymentMethod
    invoiceCustomSection?: InvoiceCustomSectionInput
  }
