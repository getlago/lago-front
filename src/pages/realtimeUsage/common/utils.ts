import { DateTime } from 'luxon'

import { DateFormat, intlFormatDateTime, TimeFormat } from '~/core/timezone'
import { RealtimeUsageTimeGranularityEnum, TimezoneEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  DEFAULT_DIMENSION_COLOR,
  DIMENSION_COLORS,
  OTHER_DIMENSION_COLOR,
  SERIES_KEY_PREFIX,
} from './constants'
import { PeriodPoint, RealtimeUsageReport, Series } from './types'

export const seriesValue = (point: PeriodPoint | undefined, key: string): number => {
  const value = point?.[key]

  return typeof value === 'number' ? value : 0
}

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
  if (dimension.other) return OTHER_DIMENSION_COLOR
  if (!dimension.name) return DEFAULT_DIMENSION_COLOR

  return DIMENSION_COLORS[rank % DIMENSION_COLORS.length]
}

const periodDuration = (granularity: RealtimeUsageTimeGranularityEnum): { hours: number } =>
  granularity === RealtimeUsageTimeGranularityEnum.Day ? { hours: 24 } : { hours: 1 }

// The period still filling is drawn lighter than the closed ones.
export const isPartialPeriod = (
  time: string,
  granularity: RealtimeUsageTimeGranularityEnum,
  now: DateTime,
): boolean => DateTime.fromISO(time).plus(periodDuration(granularity)) > now

// The API already ranks the dimensions and folds the tail, so the series follow its order.
export const buildSeriesAndPoints = (
  report: RealtimeUsageReport | undefined,
  translate: TranslateFunc,
  now: DateTime = DateTime.now(),
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

// Rolling windows end now and start on the hour wall the API snaps to, in the organization's
// timezone. The start only moves when the hour turns, so a minute tick does not refetch.
export const rollingWindowStartOf = (now: DateTime, hours: number, timezoneName: string): string =>
  now
    .setZone(timezoneName)
    .startOf('hour')
    .minus({ hours: hours - 1 })
    .toUTC()
    .toISO() || ''
