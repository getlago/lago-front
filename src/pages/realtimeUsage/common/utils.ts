import { DateTime } from 'luxon'

import { isValidDateRangeValue } from '~/components/Filters/graphql/utils'
import {
  DEFAULT_FILTER_COLOR,
  FILTER_COLORS,
  OTHER_FILTER_COLOR,
} from '~/components/subscriptions/realtimeUsage/graph/constants'
import { REALTIME_USAGE_MAX_DAYS } from '~/core/constants/realtimeUsage'
import { DateFormat, intlFormatDateTime, TimeFormat } from '~/core/timezone'
import { RealtimeUsageTimeGranularityEnum, TimezoneEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { SERIES_KEY_PREFIX } from './constants'
import { PeriodPoint, RealtimeUsageReport, Series } from './types'

export const dimensionLabelOf = (
  dimension: { name?: string | null; other: boolean },
  translate: TranslateFunc,
): string => {
  if (dimension.other) return translate('text_1787607502687pyo0kxh1flz')

  return dimension.name || translate('text_17876075026872bdz1e5aeep')
}

export const dimensionColorOf = (
  dimension: { name?: string | null; other: boolean },
  rank: number,
): string => {
  if (dimension.other) return OTHER_FILTER_COLOR
  if (!dimension.name) return DEFAULT_FILTER_COLOR

  return FILTER_COLORS[rank % FILTER_COLORS.length]
}

const periodDuration = (granularity: RealtimeUsageTimeGranularityEnum): { hours: number } =>
  granularity === RealtimeUsageTimeGranularityEnum.Day ? { hours: 24 } : { hours: 1 }

export const isPartialPeriod = (
  time: string,
  granularity: RealtimeUsageTimeGranularityEnum,
  now: DateTime,
): boolean => DateTime.fromISO(time).plus(periodDuration(granularity)) > now

export const buildDimensionSeries = (
  report: RealtimeUsageReport | undefined,
  translate: TranslateFunc,
  now: DateTime,
): { series: Series[]; points: PeriodPoint[] } => {
  if (!report) return { series: [], points: [] }

  let colorRank = 0

  const series: Series[] = report.dimensions.map((dimension, index) => ({
    key: `${SERIES_KEY_PREFIX}${index}`,
    dimensionKey: dimension.key,
    label: dimensionLabelOf(dimension, translate),
    color: dimensionColorOf(dimension, dimension.other || !dimension.name ? 0 : colorRank++),
  }))

  const keyByDimension = new Map(series.map((serie) => [serie.dimensionKey, serie.key]))

  const points: PeriodPoint[] = report.points.map((point) => {
    const periodPoint: PeriodPoint = {
      time: point.time,
      isPartial: isPartialPeriod(point.time, report.timeGranularity, now),
    }

    series.forEach((serie) => {
      periodPoint[serie.key] = 0
    })

    point.breakdown.forEach((usage) => {
      const key = keyByDimension.get(usage.dimensionKey)

      if (key) periodPoint[key] = usage.units
    })

    return periodPoint
  })

  return { series, points }
}

export const formatPeriod = (
  time: string,
  granularity: RealtimeUsageTimeGranularityEnum,
  timezone: TimezoneEnum,
): string => {
  const { date, time: hour } = intlFormatDateTime(time, {
    timezone,
    formatDate: DateFormat.DATE_MED,
    formatTime: TimeFormat.TIME_24_SIMPLE,
  })

  return granularity === RealtimeUsageTimeGranularityEnum.Day ? date : `${date}, ${hour}`
}

export const isApplicableRange = (value?: string | null): value is string => {
  if (!value || !isValidDateRangeValue(value)) return false

  const [from, to] = value.split(',')

  return DateTime.fromISO(to).diff(DateTime.fromISO(from), 'days').days <= REALTIME_USAGE_MAX_DAYS
}

export const heldKeyOf = (variables: Record<string, unknown>): string =>
  JSON.stringify({ ...variables, fromDatetime: undefined, toDatetime: undefined })
