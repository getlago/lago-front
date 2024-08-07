// By convention, we use value then metadata (usually display value) on each side of the separator.
export const filterDataInlineSeparator = '|-_-|'

export enum AvailableQuickFilters {
  InvoiceStatus = 'invoiceStatus',
}

// From keyof Omit<QueryInvoicesArgs, 'page' | 'limit' | 'searchTerm'>
export enum AvailableFiltersEnum {
  currency = 'currency',
  customerExternalId = 'customerExternalId',
  invoiceType = 'invoiceType',
  issuingDate = 'issuingDate',
  paymentDisputeLost = 'paymentDisputeLost',
  paymentOverdue = 'paymentOverdue',
  paymentStatus = 'paymentStatus',
  status = 'status',
}

export const InvoiceAvailableFilters = [
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.invoiceType,
  AvailableFiltersEnum.issuingDate,
  AvailableFiltersEnum.paymentDisputeLost,
  AvailableFiltersEnum.paymentOverdue,
  AvailableFiltersEnum.paymentStatus,
  AvailableFiltersEnum.status,
]

export const mapFilterToTranslationKey = (filter: AvailableFiltersEnum) => {
  switch (filter) {
    case AvailableFiltersEnum.status:
      return 'text_63ac86d797f728a87b2f9fa7'
    case AvailableFiltersEnum.invoiceType:
      return 'text_632d68358f1fedc68eed3e5a'
    case AvailableFiltersEnum.paymentStatus:
      return 'text_63eba8c65a6c8043feee2a0f'
    case AvailableFiltersEnum.currency:
      return 'text_632b4acf0c41206cbcb8c324'
    case AvailableFiltersEnum.issuingDate:
      return 'text_6419c64eace749372fc72b39'
    case AvailableFiltersEnum.customerExternalId:
      return 'text_65201c5a175a4b0238abf29a'
    case AvailableFiltersEnum.paymentDisputeLost:
      return 'text_66141e30699a0631f0b2ed32'
    case AvailableFiltersEnum.paymentOverdue:
      return 'text_666c5b12fea4aa1e1b26bf55'
    default:
      return filter
  }
}
