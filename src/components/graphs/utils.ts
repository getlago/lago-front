import { DateTime } from 'luxon'

import { AreaChartDataType } from '~/components/designSystem/graphs/types'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'

export const GRAPH_YEAR_MONTH_DATE_FORMAT = 'LLL. yyyy'

export type TAreaChartDataResult = {
  amountCents: string | number
  currency?: CurrencyEnum | null | undefined
  month: string | null
}[]

export const getLastTwelveMonthsNumbersUntilNow = () => {
  const monthsNumberList = []
  let cursor = DateTime.now().startOf('month')

  while (monthsNumberList.length < 13) {
    monthsNumberList.unshift(cursor.toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT))
    cursor = cursor.minus({ month: 1 })
  }

  return monthsNumberList
}

export const padAndTransformDataOverLastTwelveMonth = (
  data: TAreaChartDataResult,
  currency: CurrencyEnum,
) => {
  const monthsArray = getLastTwelveMonthsNumbersUntilNow()

  // Create an array of 12 months and replace the values with the data if it exists, based on the month
  // Or create a new object with the month and the amountCents set to 0
  return monthsArray.map((month) => {
    const item = data.find(
      (d) => DateTime.fromISO(d.month as string).toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT) === month,
    )

    return item
      ? {
          ...item,
          month: DateTime.fromISO(item.month as string).toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
        }
      : { currency, month, amountCents: 0 }
  })
}

export const formatDataForAreaChart = (
  data: TAreaChartDataResult,
  currency: CurrencyEnum,
): AreaChartDataType[] => {
  data = padAndTransformDataOverLastTwelveMonth(data, currency)

  return data?.map((item: TAreaChartDataResult[0]) => ({
    tooltipLabel: `${item.month}: ${intlFormatNumber(
      deserializeAmount(item.amountCents, item.currency || CurrencyEnum.Usd),
      {
        currency: item.currency as CurrencyEnum,
      },
    )}`,
    value: Number(item.amountCents),
    axisName: item.month as string,
  }))
}
