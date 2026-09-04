import { GetWalletForTopUpQuery } from '~/generated/graphql'
import { TWalletTopUpDataForm } from '~/pages/wallet/topUp/types'

export const WALLET_TOP_UP_DEFAULT_PRIORITY = '50'

/**
 * Top-up form default values. Call it INLINE on every render: TanStack
 * re-seeds an untouched form when defaults deep-change as the wallet query
 * resolves (the old form captured wallet?.invoiceRequiresSuccessfulPayment
 * once at mount, which only worked when the wallet was already cached).
 */
export const mapFromApiToForm = ({
  wallet,
  purchaseOrderNumber,
}: {
  wallet: GetWalletForTopUpQuery['wallet'] | undefined
  /** Prefill for the regenerate flow: the voided invoice's PO number. */
  purchaseOrderNumber?: string | null
}): TWalletTopUpDataForm => ({
  grantedCredits: '',
  invoiceRequiresSuccessfulPayment: wallet?.invoiceRequiresSuccessfulPayment,
  paidCredits: '',
  name: undefined,
  metadata: undefined,
  ignorePaidTopUpLimits: undefined,
  priority: WALLET_TOP_UP_DEFAULT_PRIORITY,
  purchaseOrderNumber: purchaseOrderNumber || undefined,
})

// Static empty defaults — for `withForm` section typing only.
export const emptyTopUpFormDefaultValues = (): TWalletTopUpDataForm =>
  mapFromApiToForm({ wallet: undefined })
