import { QueryInvoicesArgs } from '~/generated/graphql'

export enum AvailableQuickFilters {
  InvoiceStatus = 'invoiceStatus',
}

// Note: & 'issuingDate' is used for display purpose, as it would group issuingDateFrom and issuingDateTo
export type AvailableFilters = keyof Omit<QueryInvoicesArgs, 'page' | 'limit' | 'searchTerm'> &
  'issuingDate'
