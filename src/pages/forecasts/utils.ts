import { DateTime, DateTimeUnit, Duration, DurationUnit, Interval } from 'luxon'

import { AvailableFiltersEnum, getFilterValue } from '~/components/designSystem/Filters'
import { FORECASTS_FILTER_PREFIX } from '~/core/constants/filters'
import { TimeGranularityEnum } from '~/generated/graphql'

export const FORECASTS_GRAPH_COLORS = {
  optimistic: '#66DD93',
  realistic: '#5195FF',
  pessimistic: '#FF9351',
}

const DIFF_CURSOR: Record<TimeGranularityEnum, DurationUnit> = {
  [TimeGranularityEnum.Daily]: 'days',
  [TimeGranularityEnum.Weekly]: 'weeks',
  [TimeGranularityEnum.Monthly]: 'months',
} as const

export const formatForecastsData = ({
  data,
  searchParams,
  defaultStaticDatePeriod,
  defaultStaticTimeGranularity,
}: {
  data: any[] | undefined
  searchParams: URLSearchParams
  defaultStaticDatePeriod: string
  defaultStaticTimeGranularity: string
}): any[] => {
  const datePeriod =
    getFilterValue({
      key: AvailableFiltersEnum.date,
      searchParams,
      prefix: FORECASTS_FILTER_PREFIX,
    }) || defaultStaticDatePeriod

  const timeGranularity = (getFilterValue({
    key: AvailableFiltersEnum.timeGranularity,
    searchParams,
    prefix: FORECASTS_FILTER_PREFIX,
  }) || defaultStaticTimeGranularity) as TimeGranularityEnum

  const [startDate, endDate] = datePeriod.split(',')

  const diffCursor = DIFF_CURSOR[timeGranularity]

  const intervalData = Interval.fromDateTimes(
    DateTime.fromISO(startDate).startOf(diffCursor as DateTimeUnit),
    DateTime.fromISO(endDate).endOf(diffCursor as DateTimeUnit),
  )
    .splitBy(Duration.fromDurationLike({ [diffCursor]: 1 }))
    .map((i) => i.toISODate())

  const paddedData = intervalData.map((interval, index) => {
    const [start, end = ''] = interval.split('/')

    const readableEnd =
      timeGranularity === TimeGranularityEnum.Weekly && index !== intervalData.length - 1
        ? DateTime.fromISO(end).minus({ day: 1 }).toISODate()
        : end

    const foundDataWithSamePeriod = data?.find((d) => d.startOfPeriodDt === start)

    if (foundDataWithSamePeriod) {
      return foundDataWithSamePeriod
    }

    const emptyData: any = {
      startOfPeriodDt: start,
      endOfPeriodDt: readableEnd,
      optimistic: 0,
      realistic: 0,
      pessimistic: 0,
    }

    return emptyData
  })

  return paddedData
}
