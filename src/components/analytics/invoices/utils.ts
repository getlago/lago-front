import { DateTime } from 'luxon'

import { InvoiceCollectionsFakeData } from '~/components/designSystem/graphs/fixtures'
import { TFormatInvoiceCollectionsDataReturn } from '~/components/graphs/Invoices'
import {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import {
  getLastTwelveMonthsNumbersUntilNow,
  GRAPH_YEAR_MONTH_DATE_FORMAT,
} from '~/components/graphs/utils'
import { CurrencyEnum, InvoicePaymentStatusTypeEnum } from '~/generated/graphql'
import { TInvoiceCollectionsDataResult } from '~/pages/analytics/Invoices'

const LINE_DATA_ALL_KEY_NAME = 'all'

export const fillInvoicesDataPerMonthForPaymentStatus = (
  data: TInvoiceCollectionsDataResult | undefined,
  paymentStatus: InvoicePaymentStatusTypeEnum,
  currency: CurrencyEnum,
): TInvoiceCollectionsDataResult => {
  const lastTwelveMonths = getLastTwelveMonthsNumbersUntilNow()
  const res = []

  for (const month of lastTwelveMonths) {
    const existingMonthData = data?.find(
      (d) =>
        d.paymentStatus === paymentStatus &&
        DateTime.fromISO(d.month).toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT) === month,
    )

    if (existingMonthData) {
      res.push({
        ...existingMonthData,
        month: DateTime.fromISO(existingMonthData.month).toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
      })
    } else {
      res.push({
        paymentStatus,
        invoicesCount: '0',
        amountCents: '0',
        currency,
        month,
      })
    }
  }

  return res
}

export const formatInvoiceCollectionsData = (
  data: TInvoiceCollectionsDataResult | undefined,
  currency: CurrencyEnum,
): TFormatInvoiceCollectionsDataReturn => {
  const res = new Map()

  res.set(
    InvoicePaymentStatusTypeEnum.Succeeded,
    fillInvoicesDataPerMonthForPaymentStatus(
      data,
      InvoicePaymentStatusTypeEnum.Succeeded,
      currency,
    ),
  )
  res.set(
    InvoicePaymentStatusTypeEnum.Failed,
    fillInvoicesDataPerMonthForPaymentStatus(data, InvoicePaymentStatusTypeEnum.Failed, currency),
  )
  res.set(
    InvoicePaymentStatusTypeEnum.Pending,
    fillInvoicesDataPerMonthForPaymentStatus(data, InvoicePaymentStatusTypeEnum.Pending, currency),
  )

  return res
}

export const extractDataForDisplay = (
  data: TFormatInvoiceCollectionsDataReturn,
): Map<InvoicePaymentStatusTypeEnum | string, { invoicesCount: number; amountCents: number }> => {
  const res = new Map()

  const getStatusDataReducer = (
    acc: Pick<TInvoiceCollectionsDataResult[0], 'invoicesCount' | 'amountCents'>,
    curr: { invoicesCount: string; amountCents: string },
  ) => {
    acc.amountCents += Number(curr.amountCents || 0)
    acc.invoicesCount += Number(curr.invoicesCount || 0)

    return acc
  }

  res.set(
    InvoicePaymentStatusTypeEnum.Succeeded,
    data
      .get(InvoicePaymentStatusTypeEnum.Succeeded)
      ?.reduce(getStatusDataReducer, { invoicesCount: 0, amountCents: 0 }),
  )
  res.set(
    InvoicePaymentStatusTypeEnum.Failed,
    data
      .get(InvoicePaymentStatusTypeEnum.Failed)
      ?.reduce(getStatusDataReducer, { invoicesCount: 0, amountCents: 0 }),
  )
  res.set(
    InvoicePaymentStatusTypeEnum.Pending,
    data
      .get(InvoicePaymentStatusTypeEnum.Pending)
      ?.reduce(getStatusDataReducer, { invoicesCount: 0, amountCents: 0 }),
  )
  res.set(LINE_DATA_ALL_KEY_NAME, {
    invoicesCount:
      res.get(InvoicePaymentStatusTypeEnum.Succeeded)?.invoicesCount +
      res.get(InvoicePaymentStatusTypeEnum.Failed)?.invoicesCount +
      res.get(InvoicePaymentStatusTypeEnum.Pending)?.invoicesCount,
    amountCents:
      res.get(InvoicePaymentStatusTypeEnum.Succeeded)?.amountCents +
      res.get(InvoicePaymentStatusTypeEnum.Failed)?.amountCents +
      res.get(InvoicePaymentStatusTypeEnum.Pending)?.amountCents,
  })

  return res
}

export const getAllDataForInvoicesDisplay = ({
  currency,
  data,
  period,
}: {
  currency: CurrencyEnum
  data: TInvoiceCollectionsDataResult | undefined
  period: TPeriodScopeTranslationLookupValue
}) => {
  const paddedData = formatInvoiceCollectionsData(
    !data ? InvoiceCollectionsFakeData : data,
    currency,
  )

  if (period === AnalyticsPeriodScopeEnum.Quarter) {
    paddedData.forEach((values, key) => {
      paddedData.set(
        key,
        values.filter((_, index) => index > 8),
      )
    })
  } else if (period === AnalyticsPeriodScopeEnum.Month) {
    paddedData.forEach((values, key) => {
      paddedData.set(
        key,
        values.filter((_, index) => index > 10),
      )
    })
  }

  const [from, to] = [
    paddedData.get(InvoicePaymentStatusTypeEnum.Succeeded)?.[0]?.month,
    paddedData.get(InvoicePaymentStatusTypeEnum.Succeeded)?.[
      (paddedData.get(InvoicePaymentStatusTypeEnum.Succeeded)?.length || 1) - 1
    ]?.month,
  ]
  const extractedData = extractDataForDisplay(paddedData)
  const hasOnlyZeroValues = extractedData.get(LINE_DATA_ALL_KEY_NAME)?.amountCents === 0
  const total =
    (extractedData.get(InvoicePaymentStatusTypeEnum.Failed)?.amountCents || 0) +
    (extractedData.get(InvoicePaymentStatusTypeEnum.Pending)?.amountCents || 0)

  const localBarGraphData = [
    {
      [InvoicePaymentStatusTypeEnum.Succeeded]: hasOnlyZeroValues
        ? 1
        : extractedData.get(InvoicePaymentStatusTypeEnum.Succeeded)?.amountCents || 0,
      [InvoicePaymentStatusTypeEnum.Failed]: hasOnlyZeroValues
        ? 1
        : extractedData.get(InvoicePaymentStatusTypeEnum.Failed)?.amountCents || 0,
      [InvoicePaymentStatusTypeEnum.Pending]: hasOnlyZeroValues
        ? 1
        : extractedData.get(InvoicePaymentStatusTypeEnum.Pending)?.amountCents || 0,
    },
  ]

  return {
    barGraphData: localBarGraphData,
    dateFrom: from,
    dateTo: to,
    lineData: extractedData,
    totalAmount: total,
  }
}

export const getDatesFromPeriod = (period: TPeriodScopeTranslationLookupValue) => {
  let from = DateTime.now()
  let month = 12

  if (period === AnalyticsPeriodScopeEnum.Year) {
    from = DateTime.now().minus({ years: 1 })
  } else if (period === AnalyticsPeriodScopeEnum.Quarter) {
    from = DateTime.now().minus({ months: 3 })
    month = from.month
  } else if (period === AnalyticsPeriodScopeEnum.Month) {
    from = DateTime.now().minus({ months: 1 })
    month = from.month
  }

  return {
    from: from.toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
    to: DateTime.now().toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
    month,
  }
}
