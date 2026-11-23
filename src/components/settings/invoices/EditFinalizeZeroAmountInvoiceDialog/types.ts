import { z } from 'zod'

import {
  EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment,
  EditCustomerFinalizeZeroAmountInvoiceForDialogFragment,
  FinalizeZeroAmountInvoiceEnum,
} from '~/generated/graphql'

import { editFinalizeZeroAmountInvoiceValidationSchema } from './validationSchema'

export type FinalizeZeroAmountInvoiceEntity =
  | EditCustomerFinalizeZeroAmountInvoiceForDialogFragment
  | EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment

export type EditFinalizeZeroAmountInvoiceDialogData = {
  entity?: FinalizeZeroAmountInvoiceEntity | null
  finalizeZeroAmountInvoice?: FinalizeZeroAmountInvoiceEnum | boolean | null
}

export type EditFinalizeZeroAmountInvoiceFormValues = z.infer<
  typeof editFinalizeZeroAmountInvoiceValidationSchema
>

export const EDIT_FINALIZE_ZERO_AMOUNT_INVOICE_INITIAL_VALUES: EditFinalizeZeroAmountInvoiceFormValues =
  {
    finalizeZeroAmountInvoice: '',
  }
