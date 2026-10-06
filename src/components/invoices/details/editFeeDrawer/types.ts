import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { FeeForCreateFeeDrawerFragment } from '~/generated/graphql'
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
