import {
  DEFAULT_SERIES_KEY,
  OTHER_SERIES_KEY,
} from '~/components/subscriptions/realtimeUsage/common/constants'
import { RealtimeUsage } from '~/components/subscriptions/realtimeUsage/common/types'
import { filterLabelOf, seriesKeyOf } from '~/components/subscriptions/realtimeUsage/common/utils'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import {
  DEFAULT_FILTER_COLOR,
  FILTER_COLORS,
  MAX_VISIBLE_FILTERS,
  OTHER_FILTER_COLOR,
} from './constants'
import { HourPoint, Series } from './types'

export const seriesValue = (point: HourPoint | undefined, key: string): number => {
  const value = point?.[key]

  return typeof value === 'number' ? value : 0
}

export const findPoint = (
  points: HourPoint[],
  point: HourPoint | undefined,
): HourPoint | undefined => points.find((candidate) => candidate.time === point?.time) || point

export const totalOf = (point: HourPoint, series: Series[]): number =>
  series.reduce((sum, serie) => sum + seriesValue(point, serie.key), 0)

// Top filters keep one color each; everything past the cap, including the
// series the API already folded, goes into a single grey "Other" series rather
// than growing the palette.
export const buildSeriesAndPoints = (
  filters: RealtimeUsage['filters'] | undefined,
  hours: RealtimeUsage['hours'] | undefined,
  translate: TranslateFunc,
): { series: Series[]; points: HourPoint[] } => {
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
          ? DEFAULT_FILTER_COLOR
          : FILTER_COLORS[colorIndex++ % FILTER_COLORS.length],
    }
  })

  if (visible.length < filters.length) {
    series.push({
      key: OTHER_SERIES_KEY,
      label: translate('text_1787607502687pyo0kxh1flz'),
      color: OTHER_FILTER_COLOR,
    })
  }

  const lastIndex = hours.length - 1

  const points: HourPoint[] = hours.map((hour, index) => {
    const point: HourPoint = { time: hour.time, isPartial: index === lastIndex }

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
