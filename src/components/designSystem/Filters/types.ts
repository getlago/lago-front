// By convention, we use value then metadata (usually display value) on each side of the separator.
export const filterDataInlineSeparator = '|-_-|'

export enum AvailableQuickFilters {
  InvoiceStatus = 'invoiceStatus',
}

export enum AmountFilterInterval {
  isBetween = 'isBetween',
  isEqualTo = 'isEqualTo',
  isUpTo = 'isUpTo',
  isAtLeast = 'isAtLeast',
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
  invoiceNumber = 'invoiceNumber',
  amount = 'amount',
  creditNoteReason = 'creditNoteReason',
  creditNoteCreditStatus = 'creditNoteCreditStatus',
  creditNoteRefundStatus = 'creditNoteRefundStatus',
}

export const CreditNoteAvailableFilters = [
  AvailableFiltersEnum.amount,
  AvailableFiltersEnum.creditNoteCreditStatus,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.invoiceNumber,
  AvailableFiltersEnum.issuingDate,
  AvailableFiltersEnum.creditNoteReason,
  AvailableFiltersEnum.creditNoteRefundStatus,
]

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

const translationMap: Record<AvailableFiltersEnum, string> = {
  [AvailableFiltersEnum.status]: 'text_63ac86d797f728a87b2f9fa7',
  [AvailableFiltersEnum.invoiceType]: 'text_632d68358f1fedc68eed3e5a',
  [AvailableFiltersEnum.paymentStatus]: 'text_63eba8c65a6c8043feee2a0f',
  [AvailableFiltersEnum.currency]: 'text_632b4acf0c41206cbcb8c324',
  [AvailableFiltersEnum.issuingDate]: 'text_6419c64eace749372fc72b39',
  [AvailableFiltersEnum.customerExternalId]: 'text_65201c5a175a4b0238abf29a',
  [AvailableFiltersEnum.paymentDisputeLost]: 'text_66141e30699a0631f0b2ed32',
  [AvailableFiltersEnum.paymentOverdue]: 'text_666c5b12fea4aa1e1b26bf55',
  [AvailableFiltersEnum.invoiceNumber]: 'text_1734698875218fbxzci2g2s2',
  [AvailableFiltersEnum.amount]: 'text_17346988752182hpzppdqk9t',
  [AvailableFiltersEnum.creditNoteReason]: 'text_1734703891144ptrs5sty2bg',
  [AvailableFiltersEnum.creditNoteCreditStatus]: 'text_173470389114473bzrbyh6va',
  [AvailableFiltersEnum.creditNoteRefundStatus]: 'text_1734703891144vv5iclhl4vz',
}

export const mapFilterToTranslationKey = (filter: AvailableFiltersEnum) => {
  return translationMap[filter] || filter
}
