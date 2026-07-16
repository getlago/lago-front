import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { toInvoiceCustomSectionReference } from '~/components/invoceCustomFooter/utils'
import { CreateCustomerWalletTransactionInput } from '~/generated/graphql'
import { WALLET_TOP_UP_DEFAULT_PRIORITY } from '~/pages/wallet/topUp/mappers/mapFromApiToForm'
import { TWalletTopUpDataForm } from '~/pages/wallet/topUp/types'

/**
 * Form → createCustomerWalletTransaction input, 1:1 parity port of the old
 * onSubmit serialization. Note `Number(priority) || 50`: an emptied priority
 * ('' → 0) falls back to the default, and so would an explicit 0.
 */
export const mapFormToCreateInput = (
  formValues: TWalletTopUpDataForm,
  { walletId }: { walletId: string },
): CreateCustomerWalletTransactionInput => {
  const {
    grantedCredits,
    paidCredits,
    invoiceRequiresSuccessfulPayment,
    ignorePaidTopUpLimits,
    invoiceCustomSection,
    paymentMethod,
    priority,
    ...rest
  } = formValues

  return {
    ...rest,
    walletId,
    priority: Number(priority) || Number(WALLET_TOP_UP_DEFAULT_PRIORITY),
    grantedCredits: grantedCredits === '' ? '0' : String(grantedCredits),
    paidCredits: paidCredits === '' ? '0' : String(paidCredits),
    invoiceRequiresSuccessfulPayment,
    ignorePaidTopUpLimits,
    paymentMethod,
    invoiceCustomSection: toInvoiceCustomSectionReference(
      invoiceCustomSection as InvoiceCustomSectionInput,
    ),
  }
}
