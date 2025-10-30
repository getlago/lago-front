import { DateTime } from 'luxon'

import { formatActivityType } from '~/components/activityLogs/utils'
import { IsCustomerTinEmptyEnum } from '~/components/designSystem/Filters/filtersElements/FiltersItemIsCustomerTinEmpty'
import {
  PeriodScopeTranslationLookup,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import {
  ACTIVITY_LOG_FILTER_PREFIX,
  ANALYTICS_INVOICES_FILTER_PREFIX,
  ANALYTICS_USAGE_BILLABLE_METRIC_FILTER_PREFIX,
  ANALYTICS_USAGE_BREAKDOWN_FILTER_PREFIX,
  ANALYTICS_USAGE_BREAKDOWN_METERED_FILTER_PREFIX,
  ANALYTICS_USAGE_BREAKDOWN_RECURRING_FILTER_PREFIX,
  ANALYTICS_USAGE_OVERVIEW_FILTER_PREFIX,
  API_LOGS_FILTER_PREFIX,
  CREDIT_NOTE_LIST_FILTER_PREFIX,
  CUSTOMER_LIST_FILTER_PREFIX,
  FORECASTS_FILTER_PREFIX,
  INVOICE_LIST_FILTER_PREFIX,
  MRR_BREAKDOWN_OVERVIEW_FILTER_PREFIX,
  MRR_BREAKDOWN_PLANS_FILTER_PREFIX,
  PREPAID_CREDITS_OVERVIEW_FILTER_PREFIX,
  REVENUE_STREAMS_BREAKDOWN_CUSTOMER_FILTER_PREFIX,
  REVENUE_STREAMS_BREAKDOWN_PLAN_FILTER_PREFIX,
  REVENUE_STREAMS_OVERVIEW_FILTER_PREFIX,
  SUBSCRIPTION_LIST_FILTER_PREFIX,
  WEBHOOK_LOGS_FILTER_PREFIX,
} from '~/core/constants/filters'
import { INVOICES_ROUTE } from '~/core/router'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'
import {
  ActivityTypeEnum,
  InvoicePaymentStatusTypeEnum,
  InvoiceStatusTypeEnum,
  WebhookStatusEnum,
} from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  ACTIVE_SUBSCRIPTIONS_INTERVALS_TRANSLATION_MAP,
  ActiveSubscriptionsFilterInterval,
  ActivityLogsAvailableFilters,
  AMOUNT_INTERVALS_TRANSLATION_MAP,
  AmountFilterInterval,
  AnalyticsInvoicesAvailableFilters,
  ApiLogsAvailableFilters,
  AvailableFiltersEnum,
  CreditNoteAvailableFilters,
  CustomerAvailableFilters,
  filterDataInlineSeparator,
  ForecastsAvailableFilters,
  InvoiceAvailableFilters,
  MrrBreakdownPlansAvailableFilters,
  MrrOverviewAvailableFilters,
  RevenueStreamsAvailablePopperFilters,
  RevenueStreamsCustomersAvailableFilters,
  RevenueStreamsPlansAvailableFilters,
  SubscriptionAvailableFilters,
  UsageBillableMetricAvailableFilters,
  UsageBreakdownAvailableFilters,
  UsageBreakdownMeteredAvailableFilters,
  UsageBreakdownRecurringAvailableFilters,
  UsageOverviewAvailableFilters,
  WebhookLogsAvailableFilters,
} from './types'

export const keyWithPrefix = (key: string, prefix?: string) => (prefix ? `${prefix}_${key}` : key)

export const parseFromToValue = (value: string, keys: { from: string; to: string }) => {
  const [interval, from, to] = value.split(',')

  const fromAmount = from !== undefined && from !== '' ? Number(from) : null
  const toAmount = to !== undefined && to !== '' ? Number(to) : null

  switch (interval) {
    case AmountFilterInterval.isEqualTo:
      return {
        [keys.from]: fromAmount,
        [keys.to]: fromAmount,
      }
    case AmountFilterInterval.isBetween:
      return {
        [keys.from]: fromAmount,
        [keys.to]: toAmount,
      }
    case AmountFilterInterval.isUpTo:
    case ActiveSubscriptionsFilterInterval.isLessThan:
      return {
        [keys.from]: null,
        [keys.to]: toAmount,
      }
    case AmountFilterInterval.isAtLeast:
    case ActiveSubscriptionsFilterInterval.isGreaterThan:
      return {
        [keys.from]: fromAmount,
        [keys.to]: null,
      }
    default:
      return {
        [keys.from]: null,
        [keys.to]: null,
      }
  }
}

export const METADATA_SPLITTER = '&'

export const parseMetadataFilter = (value: string) => {
  if (!value) {
    return []
  }

  return value.split(METADATA_SPLITTER).map((metadata) => {
    const [key, val] = metadata.split('=')

    return { key, value: val || '' }
  })
}

export const formatMetadataFilter = (metadata: { key: string; value: string }[]) => {
  return metadata
    .map((item) => (item.value ? `${item.key}=${item.value}` : `${item.key}=`))
    .join(METADATA_SPLITTER)
}

export const FiltersItemDates = [
  AvailableFiltersEnum.date,
  AvailableFiltersEnum.issuingDate,
  AvailableFiltersEnum.loggedDate,
]

export const FILTER_VALUE_MAP: Record<AvailableFiltersEnum, Function> = {
  [AvailableFiltersEnum.activityIds]: (value: string) => value.split(',').map((v) => v.trim()),
  [AvailableFiltersEnum.activitySources]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.activityTypes]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.activeSubscriptions]: (value: string) =>
    parseFromToValue(value, { from: 'activeSubscriptionsFrom', to: 'activeSubscriptionsTo' }),
  [AvailableFiltersEnum.amount]: (value: string) =>
    parseFromToValue(value, { from: 'amountFrom', to: 'amountTo' }),
  [AvailableFiltersEnum.apiKeyIds]: (value: string) =>
    value.split(',').map((v) => v.split(filterDataInlineSeparator)[0]),
  [AvailableFiltersEnum.billingEntityIds]: (value: string) =>
    (value as string).split(',').map((v) => v.split(filterDataInlineSeparator)[0]),
  [AvailableFiltersEnum.billingEntityCode]: (value: string) => value,
  [AvailableFiltersEnum.country]: (value: string) => value,
  [AvailableFiltersEnum.countries]: (value: string) =>
    (value as string).split(',').map((v) => v.split(filterDataInlineSeparator)[0]),
  [AvailableFiltersEnum.creditNoteCreditStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.creditNoteReason]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.creditNoteRefundStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.currency]: (value: string) => value,
  [AvailableFiltersEnum.currencies]: (value: string) =>
    (value as string).split(',').map((v) => v.split(filterDataInlineSeparator)[0]),
  [AvailableFiltersEnum.customerType]: (value: string) => value,
  [AvailableFiltersEnum.customerAccountType]: (value: string) => value,
  [AvailableFiltersEnum.customerExternalId]: (value: string) =>
    (value as string).split(filterDataInlineSeparator)[0],
  [AvailableFiltersEnum.isCustomerTinEmpty]: (value: string) =>
    value !== IsCustomerTinEmptyEnum.True,
  [AvailableFiltersEnum.date]: (value: string) => {
    return { fromDate: (value as string).split(',')[0], toDate: (value as string).split(',')[1] }
  },
  [AvailableFiltersEnum.hasCustomerType]: (value: string) => value === 'true',
  [AvailableFiltersEnum.httpMethods]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.httpStatuses]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.invoiceNumber]: (value: string) => value,
  [AvailableFiltersEnum.invoiceType]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.issuingDate]: (value: string) => {
    return {
      issuingDateFrom: (value as string).split(',')[0],
      issuingDateTo: (value as string).split(',')[1],
    }
  },
  [AvailableFiltersEnum.loggedDate]: (value: string) => {
    return {
      fromDate: (value as string).split(',')[0] || undefined,
      toDate: (value as string).split(',')[1] || undefined,
    }
  },
  [AvailableFiltersEnum.metadata]: (value: string) => parseMetadataFilter(value),
  [AvailableFiltersEnum.overriden]: (value: string) => value === 'true',
  [AvailableFiltersEnum.partiallyPaid]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentDisputeLost]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentOverdue]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.planCode]: (value: string) => value,
  [AvailableFiltersEnum.requestPaths]: (value: string) => value.split(',').map((v) => v.trim()),
  [AvailableFiltersEnum.resourceIds]: (value: string) => value.split(',').map((v) => v.trim()),
  [AvailableFiltersEnum.resourceTypes]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.selfBilled]: (value: string) => value === 'true',
  [AvailableFiltersEnum.states]: (value: string) =>
    (value as string).split(',').map((v) => v.split(filterDataInlineSeparator)[0]),
  [AvailableFiltersEnum.status]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.subscriptionExternalId]: (value: string) =>
    (value as string).split(filterDataInlineSeparator)[0],
  [AvailableFiltersEnum.subscriptionStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.timeGranularity]: (value: string) => value,
  [AvailableFiltersEnum.period]: (value: string) => value,
  [AvailableFiltersEnum.userEmails]: (value: string) => value.split(',').map((v) => v.trim()),
  [AvailableFiltersEnum.webhookStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.zipcodes]: (value: string) =>
    (value as string).split(',').map((v) => v.split(filterDataInlineSeparator)[0]),
  [AvailableFiltersEnum.billableMetricCode]: (value: string) => value,
}

// NOTE: this is fixing list fetching issue when new item are added to the DB and user scrolls to the bottom of the list
// In that case, we fetch new elements and display between older ones
// This is due to the pagination system, using pages instead of cursors
// This workaround is to set the default toDate value to the current time, hence enforcing a fake cursor
// The toDate is the minimum date between the fromDate and the current time
export const defineDefaultToDateValue = (
  searchParams: URLSearchParams,
  filtersNamePrefix: string,
): URLSearchParams => {
  const now = DateTime.now()
  const searchParamsCopy = new URLSearchParams(searchParams)

  const searchParamsLoggedDateEntryKey = keyWithPrefix(
    AvailableFiltersEnum.loggedDate,
    filtersNamePrefix,
  )
  const searchParamsLoggedDateEntryValue: string | undefined = Object.fromEntries(
    searchParamsCopy.entries(),
  )[searchParamsLoggedDateEntryKey]

  if (!searchParamsLoggedDateEntryValue) {
    searchParamsCopy.set(searchParamsLoggedDateEntryKey, `,${now.toISO()}`)
    return searchParamsCopy
  }

  const [fromDate, toDate = now.toISO()] = searchParamsLoggedDateEntryValue.split(',')
  const dateToEndOfDay = DateTime.fromISO(toDate).endOf('day')

  const earliestToDateVsNow = dateToEndOfDay < now ? dateToEndOfDay.toISO() : now.toISO()

  searchParamsCopy.set(searchParamsLoggedDateEntryKey, `${fromDate},${earliestToDateVsNow}`)

  return searchParamsCopy
}

type TformatFiltersForQueryReturn = {
  [key: string]: string | string[] | boolean
}

export const formatFiltersForQuery = ({
  searchParams,
  keyMap,
  availableFilters,
  filtersNamePrefix,
}: {
  searchParams: URLSearchParams
  keyMap?: Record<string, string>
  availableFilters: AvailableFiltersEnum[]
  filtersNamePrefix: string
}): TformatFiltersForQueryReturn => {
  const filtersSetInUrl = Object.fromEntries(searchParams.entries())

  return Object.entries(filtersSetInUrl).reduce((acc, cur) => {
    const current = cur as [AvailableFiltersEnum, string | string[] | boolean]
    const _key = current[0]

    const key = (
      filtersNamePrefix ? _key.replace(`${filtersNamePrefix}_`, '') : _key
    ) as AvailableFiltersEnum

    if (!availableFilters.includes(key)) {
      return acc
    }

    const filterFunction = FILTER_VALUE_MAP[key]

    const value = filterFunction ? filterFunction(current[1]) : current[1]

    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      return {
        ...acc,
        ...value,
      }
    }

    return {
      ...acc,
      [keyMap?.[key] || key]: value,
    }
  }, {} as TformatFiltersForQueryReturn)
}

export const formatFiltersForCreditNotesQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.creditNoteReason]: 'reason',
    [AvailableFiltersEnum.creditNoteCreditStatus]: 'creditStatus',
    [AvailableFiltersEnum.creditNoteRefundStatus]: 'refundStatus',
  }

  return formatFiltersForQuery({
    searchParams,
    keyMap,
    availableFilters: CreditNoteAvailableFilters,
    filtersNamePrefix: CREDIT_NOTE_LIST_FILTER_PREFIX,
  })
}

export const formatFiltersForInvoiceQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: InvoiceAvailableFilters,
    filtersNamePrefix: INVOICE_LIST_FILTER_PREFIX,
  })
}

export const formatFiltersForCustomerQuery = (searchParams: URLSearchParams) => {
  const formatted = formatFiltersForQuery({
    searchParams,
    availableFilters: CustomerAvailableFilters,
    filtersNamePrefix: CUSTOMER_LIST_FILTER_PREFIX,
  })

  if (
    formatted.activeSubscriptionsFrom !== undefined &&
    formatted.activeSubscriptionsFrom !== null
  ) {
    formatted.activeSubscriptionsCountFrom = formatted.activeSubscriptionsFrom
    delete formatted.activeSubscriptionsFrom
  }

  if (formatted.activeSubscriptionsTo !== undefined && formatted.activeSubscriptionsTo !== null) {
    formatted.activeSubscriptionsCountTo = formatted.activeSubscriptionsTo
    delete formatted.activeSubscriptionsTo
  }

  // isCustomerTinEmpty is used in analytics filter but is basically the opposite of hasTaxIdentificationNumber used in customer list query
  if (typeof formatted.isCustomerTinEmpty === 'boolean') {
    formatted.hasTaxIdentificationNumber = !formatted.isCustomerTinEmpty
    delete formatted.isCustomerTinEmpty
  }

  return formatted
}

export const formatFiltersForSubscriptionQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.subscriptionStatus]: 'status',
    [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
  }

  return formatFiltersForQuery({
    keyMap,
    searchParams,
    availableFilters: SubscriptionAvailableFilters,
    filtersNamePrefix: SUBSCRIPTION_LIST_FILTER_PREFIX,
  })
}

export const formatFiltersForRevenueStreamsQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.country]: 'customerCountry',
    [AvailableFiltersEnum.customerType]: 'customerType',
    [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
    [AvailableFiltersEnum.subscriptionExternalId]: 'externalSubscriptionId',
  }

  return formatFiltersForQuery({
    keyMap,
    searchParams,
    availableFilters: [
      ...RevenueStreamsAvailablePopperFilters,
      AvailableFiltersEnum.timeGranularity,
    ],
    filtersNamePrefix: REVENUE_STREAMS_OVERVIEW_FILTER_PREFIX,
  })
}

export const formatFiltersForRevenueStreamsPlansQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: RevenueStreamsPlansAvailableFilters,
    filtersNamePrefix: REVENUE_STREAMS_BREAKDOWN_PLAN_FILTER_PREFIX,
  })
}

export const formatFiltersForMrrQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.country]: 'customerCountry',
    [AvailableFiltersEnum.customerType]: 'customerType',
    [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
    [AvailableFiltersEnum.subscriptionExternalId]: 'externalSubscriptionId',
  }

  return formatFiltersForQuery({
    keyMap,
    searchParams,
    availableFilters: [...MrrOverviewAvailableFilters, AvailableFiltersEnum.timeGranularity],
    filtersNamePrefix: MRR_BREAKDOWN_OVERVIEW_FILTER_PREFIX,
  })
}

export const formatFiltersForMrrPlansQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: MrrBreakdownPlansAvailableFilters,
    filtersNamePrefix: MRR_BREAKDOWN_PLANS_FILTER_PREFIX,
  })
}

export const formatFiltersForRevenueStreamsCustomersQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: RevenueStreamsCustomersAvailableFilters,
    filtersNamePrefix: REVENUE_STREAMS_BREAKDOWN_CUSTOMER_FILTER_PREFIX,
  })
}

export const formatFiltersForPrepaidCreditsQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.country]: 'customerCountry',
    [AvailableFiltersEnum.customerAccountType]: 'customerType',
    [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
    [AvailableFiltersEnum.subscriptionExternalId]: 'externalSubscriptionId',
  }

  return formatFiltersForQuery({
    keyMap,
    searchParams,
    availableFilters: [...MrrOverviewAvailableFilters, AvailableFiltersEnum.timeGranularity],
    filtersNamePrefix: PREPAID_CREDITS_OVERVIEW_FILTER_PREFIX,
  })
}

export const formatFiltersForAnalyticsInvoicesQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: AnalyticsInvoicesAvailableFilters,
    filtersNamePrefix: ANALYTICS_INVOICES_FILTER_PREFIX,
  })
}

export const formatFiltersForWebhookLogsQuery = (searchParams: URLSearchParams) => {
  const filters = formatFiltersForQuery({
    searchParams,
    availableFilters: WebhookLogsAvailableFilters,
    filtersNamePrefix: WEBHOOK_LOGS_FILTER_PREFIX,
  })

  // Convert webhookStatus array to status property
  if (
    filters.webhookStatus &&
    Array.isArray(filters.webhookStatus) &&
    filters.webhookStatus.length > 0
  ) {
    return {
      status: filters.webhookStatus[0] as WebhookStatusEnum,
    }
  }

  return undefined
}

export const formatFiltersForUsageOverviewQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.country]: 'customerCountry',
    [AvailableFiltersEnum.customerAccountType]: 'customerType',
    [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
    [AvailableFiltersEnum.subscriptionExternalId]: 'externalSubscriptionId',
  }

  return formatFiltersForQuery({
    keyMap,
    searchParams,
    availableFilters: [...UsageOverviewAvailableFilters, AvailableFiltersEnum.timeGranularity],
    filtersNamePrefix: ANALYTICS_USAGE_OVERVIEW_FILTER_PREFIX,
  })
}

export const formatFiltersForUsageBreakdownQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.country]: 'customerCountry',
    [AvailableFiltersEnum.customerAccountType]: 'customerType',
    [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
    [AvailableFiltersEnum.subscriptionExternalId]: 'externalSubscriptionId',
  }

  return formatFiltersForQuery({
    keyMap,
    searchParams,
    availableFilters: UsageBreakdownAvailableFilters,
    filtersNamePrefix: ANALYTICS_USAGE_BREAKDOWN_FILTER_PREFIX,
  })
}

export const formatFiltersForUsageBreakdownMeteredQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: UsageBreakdownMeteredAvailableFilters,
    filtersNamePrefix: ANALYTICS_USAGE_BREAKDOWN_METERED_FILTER_PREFIX,
  })
}

export const formatFiltersForUsageBreakdownRecurringQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: UsageBreakdownRecurringAvailableFilters,
    filtersNamePrefix: ANALYTICS_USAGE_BREAKDOWN_RECURRING_FILTER_PREFIX,
  })
}

export const formatFiltersForUsageBillableMetricQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: [
      ...UsageBillableMetricAvailableFilters,
      AvailableFiltersEnum.timeGranularity,
    ],
    filtersNamePrefix: ANALYTICS_USAGE_BILLABLE_METRIC_FILTER_PREFIX,
  })
}

export const formatFiltersForForecastsQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.country]: 'customerCountry',
    [AvailableFiltersEnum.customerType]: 'customerType',
    [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
    [AvailableFiltersEnum.subscriptionExternalId]: 'externalSubscriptionId',
  }

  return formatFiltersForQuery({
    keyMap,
    searchParams,
    availableFilters: [...ForecastsAvailableFilters, AvailableFiltersEnum.timeGranularity],
    filtersNamePrefix: FORECASTS_FILTER_PREFIX,
  })
}

export const formatFiltersForActivityLogsQuery = (searchParams: URLSearchParams) => {
  const formatted = formatFiltersForQuery({
    searchParams: defineDefaultToDateValue(searchParams, ACTIVITY_LOG_FILTER_PREFIX),
    availableFilters: ActivityLogsAvailableFilters,
    filtersNamePrefix: ACTIVITY_LOG_FILTER_PREFIX,
  })

  if (formatted.customerExternalId) {
    formatted.externalCustomerId = formatted.customerExternalId
    delete formatted.customerExternalId
  }
  if (formatted.subscriptionExternalId) {
    formatted.externalSubscriptionId = formatted.subscriptionExternalId
    delete formatted.subscriptionExternalId
  }

  return formatted
}

export const formatFiltersForApiLogsQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams: defineDefaultToDateValue(searchParams, API_LOGS_FILTER_PREFIX),
    availableFilters: ApiLogsAvailableFilters,
    filtersNamePrefix: API_LOGS_FILTER_PREFIX,
  })
}

export const formatActiveFilterValueDisplay = (
  key: AvailableFiltersEnum,
  value: string,
  translate?: TranslateFunc,
): string => {
  if (key === AvailableFiltersEnum.amount) {
    const [interval, from, to] = value.split(',')

    const intervalLabel = translate?.(
      AMOUNT_INTERVALS_TRANSLATION_MAP[interval as AmountFilterInterval],
    )

    const isEqual = interval === AmountFilterInterval.isEqualTo

    const and =
      interval === AmountFilterInterval.isBetween
        ? translate?.('text_65f8472df7593301061e27d6').toLowerCase()
        : ''

    return `${intervalLabel} ${from || ''} ${and} ${isEqual ? '' : to || ''}`
  }

  if (key === AvailableFiltersEnum.activeSubscriptions) {
    const [interval, from, to] = value.split(',')

    const intervalLabel = translate?.(
      ACTIVE_SUBSCRIPTIONS_INTERVALS_TRANSLATION_MAP[interval as ActiveSubscriptionsFilterInterval],
    )

    const isEqual = interval === ActiveSubscriptionsFilterInterval.isEqualTo

    const and =
      interval === ActiveSubscriptionsFilterInterval.isBetween
        ? translate?.('text_65f8472df7593301061e27d6').toLowerCase()
        : ''

    return `${intervalLabel} ${from || ''} ${and} ${isEqual ? '' : to || ''}`
  }

  switch (key) {
    case AvailableFiltersEnum.activityTypes:
      return value
        .split(',')
        .map((v) => formatActivityType(v as ActivityTypeEnum))
        .join(', ')
    case AvailableFiltersEnum.customerExternalId:
      return value.split(filterDataInlineSeparator)[1] || value.split(filterDataInlineSeparator)[0]
    case AvailableFiltersEnum.isCustomerTinEmpty:
      return (
        translate?.(
          value === IsCustomerTinEmptyEnum.True
            ? 'text_17440181167432q7jzt9znuh'
            : 'text_1744018116743ntlygtcnq95',
        ) || ''
      )
    case AvailableFiltersEnum.date:
    case AvailableFiltersEnum.issuingDate:
    case AvailableFiltersEnum.loggedDate:
      return value
        .split(',')
        .map((v) => {
          return intlFormatDateTime(v, { formatDate: DateFormat.DATE_SHORT }).date
        })
        .join(' - ')
    case AvailableFiltersEnum.period:
      return (
        translate?.(PeriodScopeTranslationLookup[value as TPeriodScopeTranslationLookupValue]) || ''
      )
    case AvailableFiltersEnum.apiKeyIds:
    case AvailableFiltersEnum.billingEntityIds:
      return value
        .split(',')
        .map(
          (v) => v.split(filterDataInlineSeparator)[1] || value.split(filterDataInlineSeparator)[0],
        )
        .join(', ')
    case AvailableFiltersEnum.userEmails:
      return value.toLocaleLowerCase()
    case AvailableFiltersEnum.billableMetricCode:
      return value
    case AvailableFiltersEnum.billingEntityCode:
      return value
    default:
      return value
        .split(',')
        .map((v) => `${v.charAt(0).toUpperCase()}${v.slice(1).replace(/_/g, ' ')}`)
        .join(', ')
  }
}

export const isOutstandingUrlParams = ({
  prefix,
  searchParams,
}: {
  searchParams: URLSearchParams
  prefix?: string
}): boolean => {
  return (
    searchParams.size >= 2 &&
    searchParams.get(keyWithPrefix('paymentStatus', prefix)) ===
      `${InvoicePaymentStatusTypeEnum.Failed},${InvoicePaymentStatusTypeEnum.Pending}` &&
    searchParams.get(keyWithPrefix('status', prefix)) === InvoiceStatusTypeEnum.Finalized
  )
}

export const isSucceededUrlParams = ({
  prefix,
  searchParams,
}: {
  searchParams: URLSearchParams
  prefix?: string
}): boolean => {
  return (
    searchParams.size >= 2 &&
    searchParams.get(keyWithPrefix('paymentStatus', prefix)) ===
      InvoicePaymentStatusTypeEnum.Succeeded &&
    searchParams.get(keyWithPrefix('status', prefix)) === InvoiceStatusTypeEnum.Finalized
  )
}

export const isDraftUrlParams = ({
  prefix,
  searchParams,
}: {
  searchParams: URLSearchParams
  prefix?: string
}): boolean => {
  return (
    searchParams.size >= 1 &&
    searchParams.get(keyWithPrefix('status', prefix)) === InvoiceStatusTypeEnum.Draft
  )
}

export const isPaymentOverdueUrlParams = ({
  prefix,
  searchParams,
}: {
  searchParams: URLSearchParams
  prefix?: string
}): boolean => {
  return (
    searchParams.size >= 1 && searchParams.get(keyWithPrefix('paymentOverdue', prefix)) === 'true'
  )
}

export const isVoidedUrlParams = ({
  prefix,
  searchParams,
}: {
  searchParams: URLSearchParams
  prefix?: string
}): boolean => {
  return (
    searchParams.size >= 1 &&
    searchParams.get(keyWithPrefix('status', prefix)) === InvoiceStatusTypeEnum.Voided
  )
}

export const isPaymentDisputeLostUrlParams = ({
  prefix,
  searchParams,
}: {
  searchParams: URLSearchParams
  prefix?: string
}): boolean => {
  return (
    searchParams.size >= 1 &&
    searchParams.get(keyWithPrefix('paymentDisputeLost', prefix)) === 'true'
  )
}

export const getFilterValue = ({
  key,
  searchParams,
  prefix,
}: {
  key: AvailableFiltersEnum
  searchParams: URLSearchParams
  prefix?: string
}): string | null => {
  return searchParams.get(keyWithPrefix(key, prefix))
}

export const setFilterValue = ({
  key,
  value,
  searchParams,
  prefix,
}: {
  key: AvailableFiltersEnum
  value: string
  searchParams: URLSearchParams
  prefix?: string
}): URLSearchParams => {
  searchParams.set(keyWithPrefix(key, prefix), value)
  return searchParams
}

export const buildUrlForInvoicesWithFilters = (searchParams: URLSearchParams) => {
  const searchParamsWithPrefix: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    const prefix = keyWithPrefix(key, INVOICE_LIST_FILTER_PREFIX)

    searchParamsWithPrefix[prefix] = value
  })

  return `${INVOICES_ROUTE}?${new URLSearchParams(searchParamsWithPrefix).toString()}`
}
