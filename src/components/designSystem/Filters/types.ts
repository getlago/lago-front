// By convention, we use value then metadata (usually display value) on each side of the separator.
export const filterDataInlineSeparator = '|-_-|'

export enum AvailableQuickFilters {
  invoiceStatus = 'invoiceStatus',
  customerAccountType = 'customerAccountType',
  timeGranularity = 'timeGranularity',
  unitsAmount = 'unitsAmount',
}

export enum AmountFilterInterval {
  isBetween = 'isBetween',
  isEqualTo = 'isEqualTo',
  isUpTo = 'isUpTo',
  isAtLeast = 'isAtLeast',
}

export enum AvailableFiltersEnum {
  activityIds = 'activityIds',
  activitySources = 'activitySources',
  activityTypes = 'activityTypes',
  amount = 'amount',
  apiKeyIds = 'apiKeyIds',
  billingEntityIds = 'billingEntityIds',
  country = 'country',
  creditNoteCreditStatus = 'creditNoteCreditStatus',
  creditNoteReason = 'creditNoteReason',
  creditNoteRefundStatus = 'creditNoteRefundStatus',
  currency = 'currency',
  customerType = 'customerType',
  customerAccountType = 'accountType',
  customerExternalId = 'customerExternalId',
  date = 'date',
  invoiceNumber = 'invoiceNumber',
  invoiceType = 'invoiceType',
  issuingDate = 'issuingDate',
  loggedDate = 'loggedDate',
  partiallyPaid = 'partiallyPaid',
  paymentDisputeLost = 'paymentDisputeLost',
  paymentOverdue = 'paymentOverdue',
  paymentStatus = 'paymentStatus',
  planCode = 'planCode',
  resourceIds = 'resourceIds',
  resourceTypes = 'resourceTypes',
  selfBilled = 'selfBilled',
  status = 'status',
  subscriptionExternalId = 'subscriptionExternalId',
  timeGranularity = 'timeGranularity',
  period = 'period',
  userEmails = 'userEmails',
  webhookStatus = 'webhookStatus',
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
  AvailableFiltersEnum.billingEntityIds,
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
  AvailableFiltersEnum.billingEntityIds,
]

export const RevenueStreamsAvailablePopperFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerType,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.planCode,
  AvailableFiltersEnum.subscriptionExternalId,
]

export const CustomerAvailableFilters = [
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.billingEntityIds,
]

export const RevenueStreamsPlansAvailableFilters = [AvailableFiltersEnum.currency]
export const RevenueStreamsCustomersAvailableFilters = [AvailableFiltersEnum.currency]
export const MrrOverviewAvailableFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerType,
  AvailableFiltersEnum.customerExternalId,
]
export const MrrBreakdownPlansAvailableFilters = [AvailableFiltersEnum.currency]
export const PrepaidCreditsOverviewAvailableFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.customerExternalId,
]

export const AnalyticsInvoicesAvailableFilters = [
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.period,
]

export const UsageOverviewAvailableFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.planCode,
  AvailableFiltersEnum.subscriptionExternalId,
]

export const UsageBreakdownAvailableFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.planCode,
  AvailableFiltersEnum.subscriptionExternalId,
]

export const UsageBreakdownMeteredAvailableFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.planCode,
  AvailableFiltersEnum.subscriptionExternalId,
]

export const UsageBreakdownRecurringAvailableFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.planCode,
  AvailableFiltersEnum.subscriptionExternalId,
]

export const UsageBillableMetricAvailableFilters = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.country,
  AvailableFiltersEnum.currency,
  AvailableFiltersEnum.customerAccountType,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.planCode,
  AvailableFiltersEnum.subscriptionExternalId,
]

export const ActivityLogsAvailableFilters = [
  AvailableFiltersEnum.loggedDate,
  AvailableFiltersEnum.apiKeyIds,
  AvailableFiltersEnum.activityIds,
  AvailableFiltersEnum.resourceTypes,
  AvailableFiltersEnum.resourceIds,
  AvailableFiltersEnum.activityTypes,
  AvailableFiltersEnum.activitySources,
  AvailableFiltersEnum.customerExternalId,
  AvailableFiltersEnum.subscriptionExternalId,
  AvailableFiltersEnum.userEmails,
]

const translationMap: Record<AvailableFiltersEnum, string> = {
  [AvailableFiltersEnum.activityIds]: 'text_1747666154075d10admbnf16',
  [AvailableFiltersEnum.activitySources]: 'text_1747666154075g4ceq9ii0xm',
  [AvailableFiltersEnum.activityTypes]: 'text_1747666154075d7ame7sqkxa',
  [AvailableFiltersEnum.amount]: 'text_17346988752182hpzppdqk9t',
  [AvailableFiltersEnum.apiKeyIds]: 'text_645d071272418a14c1c76aa4',
  [AvailableFiltersEnum.billingEntityIds]: 'text_17436114971570doqrwuwhf0',
  [AvailableFiltersEnum.country]: 'text_62ab2d0396dd6b0361614da0',
  [AvailableFiltersEnum.creditNoteCreditStatus]: 'text_173470389114473bzrbyh6va',
  [AvailableFiltersEnum.creditNoteReason]: 'text_1734703891144ptrs5sty2bg',
  [AvailableFiltersEnum.creditNoteRefundStatus]: 'text_1734703891144vv5iclhl4vz',
  [AvailableFiltersEnum.currency]: 'text_632b4acf0c41206cbcb8c324',
  [AvailableFiltersEnum.customerType]: 'text_1726128938631ioz4orixel3',
  [AvailableFiltersEnum.customerAccountType]: 'text_1744108096469xz5cnvtoixf',
  [AvailableFiltersEnum.customerExternalId]: 'text_65201c5a175a4b0238abf29a',
  [AvailableFiltersEnum.date]: 'text_664cb90097bfa800e6efa3f5',
  [AvailableFiltersEnum.invoiceNumber]: 'text_1734698875218fbxzci2g2s2',
  [AvailableFiltersEnum.invoiceType]: 'text_632d68358f1fedc68eed3e5a',
  [AvailableFiltersEnum.issuingDate]: 'text_6419c64eace749372fc72b39',
  [AvailableFiltersEnum.loggedDate]: 'text_1747666154074cdsfaq5c4bz',
  [AvailableFiltersEnum.partiallyPaid]: 'text_1738071221799vib0l2z1bxe',
  [AvailableFiltersEnum.paymentDisputeLost]: 'text_66141e30699a0631f0b2ed32',
  [AvailableFiltersEnum.paymentOverdue]: 'text_666c5b12fea4aa1e1b26bf55',
  [AvailableFiltersEnum.paymentStatus]: 'text_63eba8c65a6c8043feee2a0f',
  [AvailableFiltersEnum.planCode]: 'text_642d5eb2783a2ad10d670320',
  [AvailableFiltersEnum.resourceIds]: 'text_1747666154075y3lcupj1zdd',
  [AvailableFiltersEnum.resourceTypes]: 'text_1732895022171f9vnwh5gm3q',
  [AvailableFiltersEnum.selfBilled]: 'text_1738595318403vcyh77pwiew',
  [AvailableFiltersEnum.status]: 'text_63ac86d797f728a87b2f9fa7',
  [AvailableFiltersEnum.subscriptionExternalId]: 'text_1741008626283x4p1zwj11zi',
  [AvailableFiltersEnum.timeGranularity]: '', // Used in quick filters only
  [AvailableFiltersEnum.period]: 'text_1746532851931rt2nl6vdlnh',
  [AvailableFiltersEnum.userEmails]: 'text_1747666154075t42hri31gvz',
  [AvailableFiltersEnum.webhookStatus]: 'text_63ac86d797f728a87b2f9fa7',
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
