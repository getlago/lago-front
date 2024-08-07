import { InvoicePaymentStatusTypeEnum, InvoiceStatusTypeEnum } from '~/generated/graphql'

import { AvailableFiltersEnum, filterDataInlineSeparator, InvoiceAvailableFilters } from './types'

export const formatFiltersForInvoiceQuery = (searchParams: URLSearchParams) => {
  const filtersSetInUrl = Object.fromEntries(searchParams.entries())

  return Object.entries(filtersSetInUrl).reduce(
    (acc, cur) => {
      let [key, value] = cur as [AvailableFiltersEnum, string | string[] | boolean]

      if (!InvoiceAvailableFilters.includes(key)) {
        return acc
      }

      // Format values when needed
      if (
        key === AvailableFiltersEnum.paymentStatus ||
        key === AvailableFiltersEnum.invoiceType ||
        key === AvailableFiltersEnum.status
      ) {
        value = (value as string).split(',')
      } else if (
        key === AvailableFiltersEnum.paymentDisputeLost ||
        key === AvailableFiltersEnum.paymentOverdue
      ) {
        value = value === 'true'
      } else if (key === AvailableFiltersEnum.customerExternalId) {
        value = (value as string).split(filterDataInlineSeparator)[0]
      } else if (key === AvailableFiltersEnum.issuingDate) {
        return {
          ...acc,
          issuingDateFrom: (value as string).split(',')[0],
          issuingDateTo: (value as string).split(',')[1],
        }
      }

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
