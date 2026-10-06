import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import {
  FeeForCreateFeeDrawerFragment,
  SubscriptionForCreateFeeDrawerFragment,
} from '~/generated/graphql'
import { OnRegeneratedFeeAdd } from '~/pages/CustomerInvoiceRegenerate'

export type OpenEditFeeDrawerParams =
  | {
      mode: 'edit'
      invoiceId: string
      fee: TExtendedRemainingFee
    }
  | {
      mode: 'regenerate'
      invoiceId: string
      invoiceSubscriptionId: string
      fee?: TExtendedRemainingFee
      onAdd: OnRegeneratedFeeAdd
      localFees?: FeeForCreateFeeDrawerFragment[]
    }
  | {
      mode: 'add'
      invoiceId: string
      invoiceSubscriptionId: string
    }

export type OpenEditFeeDrawer = (params: OpenEditFeeDrawerParams) => void

export type EditFeeDrawerContentProps = {
  invoiceId: string
  invoiceSubscriptionId: string | undefined
  isRegenerateMode: boolean
  fee: TExtendedRemainingFee | undefined
  localFees: FeeForCreateFeeDrawerFragment[] | undefined
  onSubscriptionLoaded: (subscription: SubscriptionForCreateFeeDrawerFragment | undefined) => void
}
