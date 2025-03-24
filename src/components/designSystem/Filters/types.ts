// By convention, we use value then metadata (usually display value) on each side of the separator.
export const filterDataInlineSeparator = '|-_-|'

export enum AvailableQuickFilters {
  invoiceStatus = 'invoiceStatus',
  customerAccountType = 'customerAccountType',
  timeGranularity = 'timeGranularity',
}

export enum AmountFilterInterval {
  isBetween = 'isBetween',
  isEqualTo = 'isEqualTo',
  isUpTo = 'isUpTo',
  isAtLeast = 'isAtLeast',
}

export enum AvailableFiltersEnum {
  amount = 'amount',
  country = 'country',
  creditNoteCreditStatus = 'creditNoteCreditStatus',
  creditNoteReason = 'creditNoteReason',
  creditNoteRefundStatus = 'creditNoteRefundStatus',
  currency = 'currency',
  customerAccountType = 'accountType',
  customerExternalId = 'customerExternalId',
  date = 'date',
  invoiceNumber = 'invoiceNumber',
  invoiceType = 'invoiceType',
  issuingDate = 'issuingDate',
  partiallyPaid = 'partiallyPaid',
  paymentDisputeLost = 'paymentDisputeLost',
  paymentOverdue = 'paymentOverdue',
  paymentStatus = 'paymentStatus',
  planCode = 'planCode',
  selfBilled = 'selfBilled',
  status = 'status',
  subscriptionExternalId = 'subscriptionExternalId',
  timeGranularity = 'timeGranularity',
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
  AvailableFiltersEnum.selfBilled,
]

export const InvoiceAvailableFilters = [
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.invoiceType,
  AvailableFiltersEnum.issuingDate,
  AvailableFiltersEnum.partiallyPaid,
  AvailableFiltersEnum.paymentDisputeLost,
  AvailableFiltersEnum.paymentOverdue,
  AvailableFiltersEnum.paymentStatus,
  AvailableFiltersEnum.status,
  AvailableFiltersEnum.amount,
  AvailableFiltersEnum.selfBilled,
]

export const RevenueStreamsAvailablePopperFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.planCode,
  AvailableFiltersEnum.subscriptionExternalId,
]

export const CustomerAvailableFilters = [AvailableFiltersEnum.customerAccountType]

export const RevenueStreamsPlansAvailableFilters = [AvailableFiltersEnum.currency]
export const RevenueStreamsCustomersAvailableFilters = [AvailableFiltersEnum.currency]
export const MrrOverviewAvailableFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.customerExternalId,
]
export const MrrBreakdownPlansAvailableFilters = [AvailableFiltersEnum.currency]

const translationMap: Record<AvailableFiltersEnum, string> = {
  [AvailableFiltersEnum.amount]: 'text_17346988752182hpzppdqk9t',
  [AvailableFiltersEnum.country]: 'text_62ab2d0396dd6b0361614da0',
  [AvailableFiltersEnum.creditNoteCreditStatus]: 'text_173470389114473bzrbyh6va',
  [AvailableFiltersEnum.creditNoteReason]: 'text_1734703891144ptrs5sty2bg',
  [AvailableFiltersEnum.creditNoteRefundStatus]: 'text_1734703891144vv5iclhl4vz',
  [AvailableFiltersEnum.currency]: 'text_632b4acf0c41206cbcb8c324',
  [AvailableFiltersEnum.customerAccountType]: 'text_1726128938631ioz4orixel3',
  [AvailableFiltersEnum.customerExternalId]: 'text_65201c5a175a4b0238abf29a',
  [AvailableFiltersEnum.date]: 'text_664cb90097bfa800e6efa3f5',
  [AvailableFiltersEnum.invoiceNumber]: 'text_1734698875218fbxzci2g2s2',
  [AvailableFiltersEnum.invoiceType]: 'text_632d68358f1fedc68eed3e5a',
  [AvailableFiltersEnum.issuingDate]: 'text_6419c64eace749372fc72b39',
  [AvailableFiltersEnum.partiallyPaid]: 'text_1738071221799vib0l2z1bxe',
  [AvailableFiltersEnum.paymentDisputeLost]: 'text_66141e30699a0631f0b2ed32',
  [AvailableFiltersEnum.paymentOverdue]: 'text_666c5b12fea4aa1e1b26bf55',
  [AvailableFiltersEnum.paymentStatus]: 'text_63eba8c65a6c8043feee2a0f',
  [AvailableFiltersEnum.planCode]: 'text_642d5eb2783a2ad10d670320',
  [AvailableFiltersEnum.selfBilled]: 'text_1738595318403vcyh77pwiew',
  [AvailableFiltersEnum.status]: 'text_63ac86d797f728a87b2f9fa7',
  [AvailableFiltersEnum.subscriptionExternalId]: 'text_1741008626283x4p1zwj11zi',
  [AvailableFiltersEnum.timeGranularity]: '', // Used in quick filters only
}

export type FiltersFormValues = {
  filters: Array<{
    filterType?: AvailableFiltersEnum
    value?: string
    disabled?: boolean
  }>
}

export const mapFilterToTranslationKey = (filter: AvailableFiltersEnum) => {
  return translationMap[filter] || filter
}
