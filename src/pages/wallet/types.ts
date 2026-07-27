import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import {
  CreateCustomerWalletInput,
  UpdateCustomerWalletInput,
  WalletForScopeSectionFragment,
} from '~/generated/graphql'

type TWalletRecurringRuleInput = NonNullable<
  CreateCustomerWalletInput['recurringTransactionRules']
>[number]

export type TWalletDataForm = Omit<
  CreateCustomerWalletInput,
  'customerId' | 'name' | 'code' | 'recurringTransactionRules'
> &
  Omit<UpdateCustomerWalletInput, 'id' | 'name' | 'code' | 'recurringTransactionRules'> & {
    // Always strings in the form ('' when unset) so they stay compatible
    // with NameAndCodeGroup's field mapping.
    name: string
    code: string
    appliesTo?: WalletForScopeSectionFragment['appliesTo']
    paymentMethod?: SelectedPaymentMethod
    invoiceCustomSection?: InvoiceCustomSectionInput
    // Rules carry the FE-shaped payment/invoicing values at runtime
    // (transformRecurringTransactionRule), not the raw GQL reference inputs
    recurringTransactionRules?: Array<
      Omit<TWalletRecurringRuleInput, 'paymentMethod' | 'invoiceCustomSection'> & {
        lagoId?: string | null
        paymentMethod?: SelectedPaymentMethod
        invoiceCustomSection?: InvoiceCustomSectionInput
      }
    > | null
  }
