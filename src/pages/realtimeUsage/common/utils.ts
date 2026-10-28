import { DateTime } from 'luxon'

import { DEFAULT_SERIES_COLOR, OTHER_SERIES_COLOR } from '~/components/realtimeUsage/constants'
import { PeriodPoint } from '~/components/realtimeUsage/types'
import { DateFormat, intlFormatDateTime, TimeFormat } from '~/core/timezone'
import { RealtimeUsageTimeGranularityEnum, TimezoneEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { DIMENSION_COLORS, SERIES_KEY_PREFIX } from './constants'
import { DimensionSeries, RealtimeUsageReport } from './types'

export const dimensionLabelOf = (
  dimension: { name?: string | null; other: boolean },
  translate: TranslateFunc,
): string => {
  if (dimension.other) return translate('text_1787607502687pyo0kxh1flz')

  return dimension.name || translate('text_17876075026872bdz1e5aeep')
}

// The usage of no dimension is grey next to named ones, but alone it is the whole chart.
export const dimensionColorOf = (
  dimension: { name?: string | null; other: boolean },
  rank: number,
  isAlone = false,
): string => {
  if (dimension.other) return OTHER_SERIES_COLOR
  if (!dimension.name && !isAlone) return DEFAULT_SERIES_COLOR

  return DIMENSION_COLORS[rank % DIMENSION_COLORS.length]
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
): { series: DimensionSeries[]; points: PeriodPoint[] } => {
  if (!report) return { series: [], points: [] }

  let colorRank = 0

  const series: DimensionSeries[] = report.dimensions.map((dimension, index) => ({
    key: `${SERIES_KEY_PREFIX}${index}`,
    dimensionKey: dimension.key,
    label: dimensionLabelOf(dimension, translate),
    color: dimensionColorOf(
      dimension,
      dimension.other || !dimension.name ? 0 : colorRank++,
      report.dimensions.length === 1,
    ),
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

export const heldKeyOf = (variables: Record<string, unknown>): string =>
  JSON.stringify({ ...variables, fromDatetime: undefined, toDatetime: undefined })
