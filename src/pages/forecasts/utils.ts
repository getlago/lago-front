import { DateTime, DateTimeUnit, Duration, DurationUnit, Interval } from 'luxon'

import { AvailableFiltersEnum, getFilterValue } from '~/components/designSystem/Filters'
import { FORECASTS_FILTER_PREFIX } from '~/core/constants/filters'
import { CurrencyEnum, DataApiUsageForecasted, TimeGranularityEnum } from '~/generated/graphql'

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
  searchParams,
  defaultStaticDatePeriod,
  defaultStaticTimeGranularity,
}: {
  data: DataApiUsageForecasted[] | undefined
  searchParams: URLSearchParams
  defaultStaticDatePeriod: string
  defaultStaticTimeGranularity: string
}): DataApiUsageForecasted[] => {
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

    const emptyData: DataApiUsageForecasted = {
      startOfPeriodDt: start,
      endOfPeriodDt: readableEnd,
      amountCurrency: CurrencyEnum.Usd,
      amountCents: 0,
      amountCentsForecastConservative: 0,
      amountCentsForecastRealistic: 0,
      amountCentsForecastOptimistic: 0,
      units: 0,
      unitsForecastConservative: 0,
      unitsForecastRealistic: 0,
      unitsForecastOptimistic: 0,
    }

    return emptyData
  })

  return paddedData
}
