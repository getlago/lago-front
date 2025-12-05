import { DateTime, DateTimeUnit, Duration, DurationUnit, Interval } from 'luxon'

import { DataApiUsageForecasted, TimeGranularityEnum } from '~/generated/graphql'

export const FORECASTS_GRAPH_COLORS = {
  amountCentsForecastConservative: '#FF9351',
  amountCentsForecastRealistic: '#5195FF',
  amountCentsForecastOptimistic: '#66DD93',
}

const DIFF_CURSOR: Record<TimeGranularityEnum, DurationUnit> = {
  [TimeGranularityEnum.Daily]: 'days',
  [TimeGranularityEnum.Weekly]: 'weeks',
  [TimeGranularityEnum.Monthly]: 'months',
} as const

export const formatForecastsData = ({
  data,
  defaultStaticDatePeriod,
  defaultStaticTimeGranularity,
}: {
  data: DataApiUsageForecasted[] | undefined
  defaultStaticDatePeriod: string
  defaultStaticTimeGranularity: string
}): DataApiUsageForecasted[] => {
  const datePeriod = defaultStaticDatePeriod
  const timeGranularity = defaultStaticTimeGranularity

  const [startDate, endDate] = datePeriod.split(',')

  const diffCursor = DIFF_CURSOR[timeGranularity as keyof typeof DIFF_CURSOR]

  const intervalData = Interval.fromDateTimes(
    DateTime.fromISO(startDate).startOf(diffCursor as DateTimeUnit),
    DateTime.fromISO(endDate).endOf(diffCursor as DateTimeUnit),
  )
    .splitBy(Duration.fromDurationLike({ [diffCursor]: 1 }))
    .map((i) => i.toISODate())

  const paddedData = intervalData
    .map((interval) => {
      const [start] = interval.split('/')

      const foundDataWithSamePeriod = data?.find((d) => d.startOfPeriodDt === start)

      if (foundDataWithSamePeriod) {
        const hasValue =
          foundDataWithSamePeriod.amountCentsForecastConservative !== '0' &&
          foundDataWithSamePeriod.amountCentsForecastRealistic !== '0' &&
          foundDataWithSamePeriod.amountCentsForecastOptimistic !== '0'

        if (hasValue) {
          return foundDataWithSamePeriod
        }
      }

      return null
    })
    .filter((dataItem) => !!dataItem)

  return paddedData
}
