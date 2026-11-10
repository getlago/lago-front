import {
  EditCustomerFinalizeZeroAmountInvoiceForDialogFragment,
  FinalizeZeroAmountInvoiceEnum,
} from '~/generated/graphql'

import { EditFinalizeZeroAmountInvoiceDialogData, FinalizeZeroAmountInvoiceEntity } from './types'

export const isCustomerEntity = (
  entity: FinalizeZeroAmountInvoiceEntity | null | undefined,
): entity is EditCustomerFinalizeZeroAmountInvoiceForDialogFragment =>
  entity?.__typename === 'Customer'

/** A customer inheriting from its billing entity opens on an empty field, not on `inherit`. */
export const getInitialValue = (data: EditFinalizeZeroAmountInvoiceDialogData): string => {
  if (
    isCustomerEntity(data.entity) &&
    data.finalizeZeroAmountInvoice === FinalizeZeroAmountInvoiceEnum.Inherit
  ) {
    return ''
  }

  return data.finalizeZeroAmountInvoice?.toString() ?? ''
}

export const toFinalizeZeroAmountInvoiceEnum = (
  value: string,
): FinalizeZeroAmountInvoiceEnum | undefined =>
  Object.values(FinalizeZeroAmountInvoiceEnum).find((option) => option === value)
