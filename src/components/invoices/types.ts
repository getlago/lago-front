import {
  CreateInvoiceInput,
  FeeInput,
  GetInvoiceFeesQuery,
  GetInvoiceSubscriptionsQuery,
  TaxInfosForCreateInvoiceFragment,
} from '~/generated/graphql'

export type LocalFeeInput = FeeInput & {
  // NOTE: this is used for display purpose but will be replaced by taxCodes[] on save
  taxes?: TaxInfosForCreateInvoiceFragment[] | null
}

export interface InvoiceFormInput extends Omit<CreateInvoiceInput, 'clientMutationId'> {
  fees: LocalFeeInput[]
}

export type InvoiceFeesForDisplay =
  | NonNullable<GetInvoiceFeesQuery['invoice']>['fees']
  | null
  | undefined

export type InvoiceSubscriptionsForDisplay =
  | NonNullable<GetInvoiceSubscriptionsQuery['invoice']>['invoiceSubscriptions']
  | null
  | undefined
