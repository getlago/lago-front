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
}: {
  wallet: GetWalletForTopUpQuery['wallet'] | undefined
}): TWalletTopUpDataForm => ({
  grantedCredits: '',
  invoiceRequiresSuccessfulPayment: wallet?.invoiceRequiresSuccessfulPayment,
  paidCredits: '',
  name: undefined,
  metadata: undefined,
  ignorePaidTopUpLimits: undefined,
  priority: 50,
})

// Static empty defaults — for `withForm` section typing only.
export const emptyTopUpFormDefaultValues = (): TWalletTopUpDataForm =>
  mapFromApiToForm({ wallet: undefined })
