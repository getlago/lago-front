import { MultipleLineChartLine } from '~/components/designSystem/graphs/MultipleLineChart'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'
import { TimeGranularityEnum } from '~/generated/graphql'

export const checkOnlyZeroValues = <T extends Record<string, unknown>>(
  data: T[],
  lines: MultipleLineChartLine<T>[],
): boolean => {
  if (!data?.length) return true

  return data.every((item) => {
    return lines
      .filter((line) => !line.hideOnGraph)
      .every((line) => {
        return Number(item[line.dataKey]) === 0
      })
  })
}

export const calculateYAxisDomain = <T extends Record<string, unknown>>(
  data: T[] | undefined,
  lines: Array<MultipleLineChartLine<T>>,
  hasOnlyZeroValues: boolean,
): [number, number] => {
  if (hasOnlyZeroValues || !data?.length) {
    return [0, 1]
  }

  let minValue: number | undefined
  let maxValue: number | undefined

  for (const item of data) {
    for (const line of lines) {
      if (!!line.hideOnGraph) {
        continue
      }

      const value = Number(item[line.dataKey])

      if (isNaN(value)) {
        continue
      }

      if (minValue === undefined || value < minValue) {
        minValue = value
      }
      if (maxValue === undefined || value > maxValue) {
        maxValue = value
      }
    }
  }

  return [minValue || 0, maxValue || 1]
}

export const getItemDateFormatedByTimeGranularity = ({
  item,
  timeGranularity,
}: {
  item: {
    startOfPeriodDt: string
    endOfPeriodDt: string
  }
  timeGranularity: TimeGranularityEnum
}): string => {
  switch (timeGranularity) {
    case TimeGranularityEnum.Daily:
      return intlFormatDateTime(item.startOfPeriodDt, {
        formatDate: DateFormat.DATE_MED_SHORT_YEAR,
      }).date
    case TimeGranularityEnum.Weekly:
      return `${
        intlFormatDateTime(item.startOfPeriodDt, {
          formatDate: DateFormat.DATE_MED_SHORT_YEAR,
        }).date
      } - ${
        intlFormatDateTime(item.endOfPeriodDt, {
          formatDate: DateFormat.DATE_MED_SHORT_YEAR,
        }).date
      }`
    default:
      return intlFormatDateTime(item.startOfPeriodDt, {
        formatDate: DateFormat.DATE_MONTH_YEAR,
      }).date
  }
}
