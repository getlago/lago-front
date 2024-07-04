import { CreateInvoiceInput, FeeInput, TaxInfosForCreateInvoiceFragment } from '~/generated/graphql'

export type LocalFeeInput = FeeInput & {
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxInfosForCreateInvoiceFragment[] | null
}

export interface InvoiceFormInput extends Omit<CreateInvoiceInput, 'clientMutationId'> {
  fees: LocalFeeInput[]
}

export enum InvoiceListStatusEnum {
  'all' = 'all',
  'draft' = 'draft',
  'outstanding' = 'outstanding',
  'succeeded' = 'succeeded',
  'voided' = 'voided',
  'disputed' = 'disputed',
  'overdue' = 'overdue',
}
