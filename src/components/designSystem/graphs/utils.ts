import { MultipleLineChartLine } from '~/components/designSystem/graphs/MultipleLineChart'
import { StackedBarChartBar } from '~/components/designSystem/graphs/StackedBarChart'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'
import { TimeGranularityEnum } from '~/generated/graphql'

export const checkOnlyZeroValues = <T extends Record<string, unknown>>(
  data: T[],
  lines: Array<MultipleLineChartLine<T> | StackedBarChartBar<T>>,
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

const collectChartValues = <T extends Record<string, unknown>>(
  data: T[],
  lines: Array<MultipleLineChartLine<T> | StackedBarChartBar<T>>,
): number[] => {
  const values: number[] = []

  for (const item of data) {
    for (const line of lines) {
      if (!!line.hideOnGraph) {
        continue
      }

      const value = Number(item[line.dataKey])

      if (!isNaN(value)) {
        values.push(value)
      }
    }
  }

  return values
}

export const calculateYAxisDomain = <T extends Record<string, unknown>>(
  data: T[] | undefined,
  lines: Array<MultipleLineChartLine<T> | StackedBarChartBar<T>>,
  hasOnlyZeroValues: boolean,
): [number, number] => {
  if (hasOnlyZeroValues || !data?.length) {
    return [0, 1]
  }

  const values = collectChartValues(data, lines)

  const min = (values.length ? Math.min(...values) : undefined) || 0
  const max = (values.length ? Math.max(...values) : undefined) || 1

  if (min === max) {
    return [min - 1, max + 1]
  }

  return [min, max]
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
