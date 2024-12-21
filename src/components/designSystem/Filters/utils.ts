import { AmountFilterInterval } from '~/components/designSystem/Filters/filtersElements/FiltersItemAmount'
import { InvoicePaymentStatusTypeEnum, InvoiceStatusTypeEnum } from '~/generated/graphql'

import {
  AvailableFiltersEnum,
  CreditNoteAvailableFilters,
  filterDataInlineSeparator,
  InvoiceAvailableFilters,
} from './types'

type FilterValueMapArgument = any

const FILTER_VALUE_MAP: Partial<
  Record<AvailableFiltersEnum, (value: FilterValueMapArgument) => any>
> = {
  [AvailableFiltersEnum.amount]: (value: string) => {
    const [interval, from, to] = value.split(',')

    switch (interval) {
      case AmountFilterInterval.isEqualTo:
        return {
          amountFrom: from,
          amountTo: from,
        }
      case AmountFilterInterval.isBetween:
        return {
          amountFrom: from,
          amountTo: to,
        }
      case AmountFilterInterval.isUpTo:
        return {
          amountFrom: null,
          amountTo: to,
        }
      case AmountFilterInterval.isAtLeast:
        return {
          amountFrom: from,
          amountTo: null,
        }
      default:
        return {
          amountFrom: null,
          amountTo: null,
        }
    }
  },
  [AvailableFiltersEnum.issuingDate]: (value: string) => {
    return {
      issuingDateFrom: (value as string).split(',')[0],
      issuingDateTo: (value as string).split(',')[1],
    }
  },
  [AvailableFiltersEnum.customerExternalId]: (value: string) =>
    (value as string).split(filterDataInlineSeparator)[0],
  [AvailableFiltersEnum.paymentDisputeLost]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentOverdue]: (value: string) => value === 'true',
  [AvailableFiltersEnum.paymentStatus]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.invoiceType]: (value: string) => (value as string).split(','),
  [AvailableFiltersEnum.status]: (value: string) => (value as string).split(','),
}

export const formatFiltersForCreditNotesQuery = (searchParams: URLSearchParams) => {
  const filtersSetInUrl = Object.fromEntries(searchParams.entries())

  return Object.entries(filtersSetInUrl).reduce(
    (acc, cur) => {
      const current = cur as [AvailableFiltersEnum, string | string[] | boolean]
      const key = current[0]

      if (!CreditNoteAvailableFilters.includes(key)) {
        return acc
      }

      const value = FILTER_VALUE_MAP[key]?.(current[1]) || current[1]

      return {
        ...acc,
        [key]: value,
      }
    },
    {} as Record<string, string | string[] | boolean>,
  )
}

export const formatFiltersForInvoiceQuery = (searchParams: URLSearchParams) => {
  const filtersSetInUrl = Object.fromEntries(searchParams.entries())

  return Object.entries(filtersSetInUrl).reduce(
    (acc, cur) => {
      const current = cur as [AvailableFiltersEnum, string | string[] | boolean]
      const key = current[0]

      if (!InvoiceAvailableFilters.includes(key)) {
        return acc
      }

      const value = FILTER_VALUE_MAP[key]?.(current[1]) || current[1]

      return {
        ...acc,
        [key]: value,
      }
    },
    {} as Record<string, string | string[] | boolean>,
  )
}

export const formatActiveFilterValueDisplay = (
  key: AvailableFiltersEnum,
  value: string,
): string => {
  switch (key) {
    case AvailableFiltersEnum.customerExternalId:
      return value.split(filterDataInlineSeparator)[1]
    case AvailableFiltersEnum.issuingDate:
      return value
        .split(',')
        .map((v) => new Date(v).toLocaleDateString('en'))
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
    searchParams.size === 2 &&
    searchParams.get('paymentStatus') ===
      `${InvoicePaymentStatusTypeEnum.Failed},${InvoicePaymentStatusTypeEnum.Pending}` &&
    searchParams.get('status') === InvoiceStatusTypeEnum.Finalized
  )
}

export const isSucceededUrlParams = (searchParams: URLSearchParams): boolean => {
  return (
    searchParams.size === 2 &&
    searchParams.get('paymentStatus') === InvoicePaymentStatusTypeEnum.Succeeded &&
    searchParams.get('status') === InvoiceStatusTypeEnum.Finalized
  )
}

export const isDraftUrlParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.size === 1 && searchParams.get('status') === InvoiceStatusTypeEnum.Draft
}

export const isPaymentOverdueUrlParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.size === 1 && searchParams.get('paymentOverdue') === 'true'
}

export const isVoidedUrlParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.size === 1 && searchParams.get('status') === InvoiceStatusTypeEnum.Voided
}

export const isPaymentDisputeLostUrlParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.size === 1 && searchParams.get('paymentDisputeLost') === 'true'
}

export const buildOutstandingUrlParams = (): string => {
  return `?paymentStatus=${InvoicePaymentStatusTypeEnum.Failed},${InvoicePaymentStatusTypeEnum.Pending}&status=${InvoiceStatusTypeEnum.Finalized}`
}

export const buildSucceededUrlParams = (): string => {
  return `?paymentStatus=${InvoicePaymentStatusTypeEnum.Succeeded}&status=${InvoiceStatusTypeEnum.Finalized}`
}

export const buildDraftUrlParams = (): string => {
  return `?status=${InvoiceStatusTypeEnum.Draft}`
}

export const buildPaymentOverdueUrlParams = (): string => {
  return `?paymentOverdue=true`
}

export const buildVoidedUrlParams = (): string => {
  return `?status=${InvoiceStatusTypeEnum.Voided}`
}

export const buildPaymentDisputeLostUrlParams = (): string => {
  return `?paymentDisputeLost=true`
}
