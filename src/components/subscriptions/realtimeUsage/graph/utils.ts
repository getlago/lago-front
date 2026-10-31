import { DEFAULT_SERIES_COLOR, OTHER_SERIES_COLOR } from '~/components/realtimeUsage/constants'
import { PeriodPoint, Series } from '~/components/realtimeUsage/types'
import {
  DEFAULT_SERIES_KEY,
  OTHER_SERIES_KEY,
} from '~/components/subscriptions/realtimeUsage/common/constants'
import { RealtimeUsage } from '~/components/subscriptions/realtimeUsage/common/types'
import { filterLabelOf, seriesKeyOf } from '~/components/subscriptions/realtimeUsage/common/utils'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { FILTER_COLORS, MAX_VISIBLE_FILTERS } from './constants'

export const seriesValue = (point: PeriodPoint | undefined, key: string): number => {
  const value = point?.[key]

  return typeof value === 'number' ? value : 0
}

export const findPoint = (
  points: PeriodPoint[],
  point: PeriodPoint | undefined,
): PeriodPoint | undefined => points.find((candidate) => candidate.time === point?.time) ?? point

export const totalOf = (point: PeriodPoint, series: Series[]): number =>
  series.reduce((sum, serie) => sum + seriesValue(point, serie.key), 0)

// Top filters keep one color each; everything past the cap, including the
// series the API already folded, goes into a single grey "Other" series rather
// than growing the palette.
export const buildSeriesAndPoints = (
  filters: RealtimeUsage['filters'] | undefined,
  hours: RealtimeUsage['hours'] | undefined,
  translate: TranslateFunc,
): { series: Series[]; points: PeriodPoint[] } => {
  if (!filters?.length || !hours?.length) {
    return { series: [], points: [] }
  }

  const visible = filters.slice(0, MAX_VISIBLE_FILTERS).filter((filter) => !filter.other)
  const visibleKeys = new Set(visible.map(seriesKeyOf))
  let colorIndex = 0

  const series: Series[] = visible.map((filter) => {
    const key = seriesKeyOf(filter)

    return {
      key,
      label: filterLabelOf(filter, translate),
      color:
        key === DEFAULT_SERIES_KEY
          ? DEFAULT_SERIES_COLOR
          : FILTER_COLORS[colorIndex++ % FILTER_COLORS.length],
    }
  })

  if (visible.length < filters.length) {
    series.push({
      key: OTHER_SERIES_KEY,
      label: translate('text_1787607502687pyo0kxh1flz'),
      color: OTHER_SERIES_COLOR,
    })
  }

  const lastIndex = hours.length - 1

  const points: PeriodPoint[] = hours.map((hour, index) => {
    const point: PeriodPoint = { time: hour.time, isPartial: index === lastIndex }

    series.forEach((serie) => {
      point[serie.key] = 0
    })

    hour.breakdown.forEach((breakdown) => {
      const breakdownKey = seriesKeyOf(breakdown)
      const key = visibleKeys.has(breakdownKey) ? breakdownKey : OTHER_SERIES_KEY

      point[key] = seriesValue(point, key) + breakdown.units
    })

    return point
  })

  return { series, points }
}
