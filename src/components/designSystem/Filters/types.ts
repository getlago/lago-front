export enum AvailableQuickFilters {
  InvoiceStatus = 'invoiceStatus',
}

// From keyof Omit<QueryInvoicesArgs, 'page' | 'limit' | 'searchTerm'>
export enum AvailableFiltersEnum {
  currency = 'currency',
  customerExternalId = 'customerExternalId',
  invoiceType = 'invoiceType',
  issuingDateFrom = 'issuingDateFrom',
  issuingDateTo = 'issuingDateTo',
  paymentDisputeLost = 'paymentDisputeLost',
  paymentOverdue = 'paymentOverdue',
  paymentStatus = 'paymentStatus',
  status = 'status',
}

export const InvoiceAvailableFilters = [
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.invoiceType,
  AvailableFiltersEnum.issuingDateFrom,
  AvailableFiltersEnum.issuingDateTo,
  AvailableFiltersEnum.paymentDisputeLost,
  AvailableFiltersEnum.paymentOverdue,
  AvailableFiltersEnum.paymentStatus,
  AvailableFiltersEnum.status,
]
