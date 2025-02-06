import { DateTime } from 'luxon'

import { intlFormatDateTime } from '~/core/timezone'
import { InvoicePaymentStatusTypeEnum, InvoiceStatusTypeEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  AmountFilterInterval,
  AvailableFiltersEnum,
  CreditNoteAvailableFilters,
  CustomerAvailableFilters,
  filterDataInlineSeparator,
  InvoiceAvailableFilters,
} from './types'

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
  [AvailableFiltersEnum.currency]: (value: string) => value,
  [AvailableFiltersEnum.invoiceNumber]: (value: string) => value,
  [AvailableFiltersEnum.customerAccountType]: (value: string) => value,
  [AvailableFiltersEnum.issuingDate]: (value: string) => {
    return {
      issuingDateFrom: (value as string).split(',')[0],
      issuingDateTo: (value as string).split(',')[1],
    }
  },
  [AvailableFiltersEnum.customerExternalId]: (value: string) =>
    (value as string).split(filterDataInlineSeparator)[0],
  [AvailableFiltersEnum.partiallyPaid]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentDisputeLost]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentOverdue]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.invoiceType]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.status]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.creditNoteReason]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.creditNoteRefundStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.creditNoteCreditStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.selfBilled]: (value: string) => value === 'true',
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
    filtersNamePrefix: 'cn',
  })
}

export const formatFiltersForInvoiceQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: InvoiceAvailableFilters,
    filtersNamePrefix: 'in',
  })
}

export const formatFiltersForCustomerQuery = (searchParams: URLSearchParams) => {
  return formatFiltersForQuery({
    searchParams,
    availableFilters: CustomerAvailableFilters,
    filtersNamePrefix: 'cu',
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
      return value.split(filterDataInlineSeparator)[1]
    case AvailableFiltersEnum.issuingDate:
      return value
        .split(',')
        .map((v) => {
          return intlFormatDateTime(v, { format: DateTime.DATE_SHORT }).date
        })
        .join(' - ')
    default:
      return value
        .split(',')
        .map((v) => `${v.charAt(0).toUpperCase()}${v.slice(1).replace(/_/g, ' ')}`)
        .join(', ')
  }
}

export const isOutstandingUrlParams = (searchParams: URLSearchParams): boolean => {
  return (
    searchParams.size >= 2 &&
    searchParams.get('paymentStatus') ===
      `${InvoicePaymentStatusTypeEnum.Failed},${InvoicePaymentStatusTypeEnum.Pending}` &&
    searchParams.get('status') === InvoiceStatusTypeEnum.Finalized
  )
}

export const isSucceededUrlParams = (searchParams: URLSearchParams): boolean => {
  return (
    searchParams.size >= 2 &&
    searchParams.get('paymentStatus') === InvoicePaymentStatusTypeEnum.Succeeded &&
    searchParams.get('status') === InvoiceStatusTypeEnum.Finalized
  )
}

export const isDraftUrlParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.size >= 1 && searchParams.get('status') === InvoiceStatusTypeEnum.Draft
}

export const isPaymentOverdueUrlParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.size >= 1 && searchParams.get('paymentOverdue') === 'true'
}

export const isVoidedUrlParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.size >= 1 && searchParams.get('status') === InvoiceStatusTypeEnum.Voided
}

export const isPaymentDisputeLostUrlParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.size >= 1 && searchParams.get('paymentDisputeLost') === 'true'
}
