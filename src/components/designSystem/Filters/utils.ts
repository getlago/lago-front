import {
  CREDIT_NOTE_LIST_FILTER_PREFIX,
  CUSTOMER_LIST_FILTER_PREFIX,
  INVOICE_LIST_FILTER_PREFIX,
  MRR_BREAKDOWN_OVERVIEW_FILTER_PREFIX,
  MRR_BREAKDOWN_PLANS_FILTER_PREFIX,
  REVENUE_STREAMS_BREAKDOWN_CUSTOMER_FILTER_PREFIX,
  REVENUE_STREAMS_BREAKDOWN_PLAN_FILTER_PREFIX,
  REVENUE_STREAMS_OVERVIEW_FILTER_PREFIX,
} from '~/core/constants/filters'
import { INVOICES_ROUTE } from '~/core/router'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'
import { InvoicePaymentStatusTypeEnum, InvoiceStatusTypeEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  AmountFilterInterval,
  AvailableFiltersEnum,
  CreditNoteAvailableFilters,
  CustomerAvailableFilters,
  filterDataInlineSeparator,
  InvoiceAvailableFilters,
  MrrBreakdownPlansAvailableFilters,
  MrrOverviewAvailableFilters,
  RevenueStreamsAvailablePopperFilters,
  RevenueStreamsCustomersAvailableFilters,
  RevenueStreamsPlansAvailableFilters,
} from './types'

const keyWithPrefix = (key: string, prefix?: string) => (prefix ? `${prefix}_${key}` : key)

export const parseAmountValue = (value: string) => {
  const [interval, from, to] = value.split(',')

  const fromAmount = from ? Number(from) : null
  const toAmount = to ? Number(to) : null

  switch (interval) {
    case AmountFilterInterval.isEqualTo:
      return {
        amountFrom: fromAmount,
        amountTo: fromAmount,
      }
    case AmountFilterInterval.isBetween:
      return {
        amountFrom: fromAmount,
        amountTo: toAmount,
      }
    case AmountFilterInterval.isUpTo:
      return {
        amountFrom: null,
        amountTo: toAmount,
      }
    case AmountFilterInterval.isAtLeast:
      return {
        amountFrom: fromAmount,
        amountTo: null,
      }
    default:
      return {
        amountFrom: null,
        amountTo: null,
      }
  }
}

export const FILTER_VALUE_MAP: Record<AvailableFiltersEnum, Function> = {
  [AvailableFiltersEnum.amount]: parseAmountValue,
  [AvailableFiltersEnum.country]: (value: string) => value,
  [AvailableFiltersEnum.creditNoteCreditStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.creditNoteReason]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.creditNoteRefundStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.currency]: (value: string) => value,
  [AvailableFiltersEnum.customerAccountType]: (value: string) => value,
  [AvailableFiltersEnum.customerExternalId]: (value: string) =>
    (value as string).split(filterDataInlineSeparator)[0],
  [AvailableFiltersEnum.date]: (value: string) => {
    return { fromDate: (value as string).split(',')[0], toDate: (value as string).split(',')[1] }
  },
  [AvailableFiltersEnum.invoiceNumber]: (value: string) => value,
  [AvailableFiltersEnum.invoiceType]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.issuingDate]: (value: string) => {
    return {
      issuingDateFrom: (value as string).split(',')[0],
      issuingDateTo: (value as string).split(',')[1],
    }
  },
  [AvailableFiltersEnum.partiallyPaid]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentDisputeLost]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentOverdue]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.planCode]: (value: string) => value,
  [AvailableFiltersEnum.selfBilled]: (value: string) => value === 'true',
  [AvailableFiltersEnum.status]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.subscriptionExternalId]: (value: string) =>
    (value as string).split(filterDataInlineSeparator)[0],
  [AvailableFiltersEnum.timeGranularity]: (value: string) => value,
}

const formatFiltersForQuery = ({
  searchParams,
  keyMap,
  availableFilters,
  filtersNamePrefix,
}: {
  searchParams: URLSearchParams
  keyMap?: Record<string, string>
  availableFilters: AvailableFiltersEnum[]
  filtersNamePrefix: string
}) => {
  const filtersSetInUrl = Object.fromEntries(searchParams.entries())

  return Object.entries(filtersSetInUrl).reduce(
    (acc, cur) => {
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
    },
    {} as Record<string, string | string[] | boolean>,
  )
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
  return formatFiltersForQuery({
    searchParams,
    availableFilters: CustomerAvailableFilters,
    filtersNamePrefix: CUSTOMER_LIST_FILTER_PREFIX,
  })
}

export const formatFiltersForRevenueStreamsQuery = (searchParams: URLSearchParams) => {
  const keyMap: Partial<Record<AvailableFiltersEnum, string>> = {
    [AvailableFiltersEnum.country]: 'customerCountry',
    [AvailableFiltersEnum.customerAccountType]: 'customerType',
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
    [AvailableFiltersEnum.customerAccountType]: 'customerType',
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

export const AMOUNT_INTERVALS_TRANSLATION_MAP = {
  [AmountFilterInterval.isBetween]: 'text_1734774653389kvylgxjiltu',
  [AmountFilterInterval.isEqualTo]: 'text_1734774653389pt3rhh3lspa',
  [AmountFilterInterval.isUpTo]: 'text_1734792781750cot2uyp6f1x',
  [AmountFilterInterval.isAtLeast]: 'text_17347927817503hromltntvm',
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

  switch (key) {
    case AvailableFiltersEnum.customerExternalId:
      return value.split(filterDataInlineSeparator)[1] || value.split(filterDataInlineSeparator)[0]
    case AvailableFiltersEnum.date:
    case AvailableFiltersEnum.issuingDate:
      return value
        .split(',')
        .map((v) => {
          return intlFormatDateTime(v, { formatDate: DateFormat.DATE_SHORT }).date
        })
        .join(' - ')
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

export const buildUrlForInvoicesWithFilters = (searchParams: URLSearchParams) => {
  const searchParamsWithPrefix: Record<string, string> = {}

  searchParams.forEach((value, key) => {
    const prefix = keyWithPrefix(key, INVOICE_LIST_FILTER_PREFIX)

    searchParamsWithPrefix[prefix] = value
  })

  return `${INVOICES_ROUTE}?${new URLSearchParams(searchParamsWithPrefix).toString()}`
}
