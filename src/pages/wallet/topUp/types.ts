import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { CreateCustomerWalletTransactionInput } from '~/generated/graphql'

// The form never holds walletId — it is injected at submit time from the
// resolved wallet (route param or active-wallet lookup).
// paymentMethod / invoiceCustomSection carry the FE-shaped values at runtime
// (set by the settings selectors), not the raw GQL reference inputs
export type TWalletTopUpDataForm = Omit<
  CreateCustomerWalletTransactionInput,
  'walletId' | 'paymentMethod' | 'invoiceCustomSection'
> & {
  paymentMethod?: SelectedPaymentMethod
  invoiceCustomSection?: InvoiceCustomSectionInput
}
