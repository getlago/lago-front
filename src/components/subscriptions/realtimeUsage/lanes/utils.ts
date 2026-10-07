import { RealtimeUsage } from '~/components/subscriptions/realtimeUsage/common/types'
import { filterLabelOf, seriesKeyOf } from '~/components/subscriptions/realtimeUsage/common/utils'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { DEFAULT_LANE_COLOR, LANE_COLOR } from './constants'
import { Lane, SortMode } from './types'

// One lane per filter the window knows about, gap-filled by the API, so a
// filter that went quiet keeps its row and draws a flat line instead of
// disappearing from the list.
export const buildLanes = (
  usage: RealtimeUsage,
  translate: TranslateFunc,
  sort: SortMode,
): Lane[] => {
  const lanes: Lane[] = usage.filters.map((filter) => {
    const key = seriesKeyOf(filter)
    const values = usage.hours.map((hour) =>
      hour.breakdown
        .filter((breakdown) => seriesKeyOf(breakdown) === key)
        .reduce((total, breakdown) => total + breakdown.units, 0),
    )

    return {
      key,
      label: filterLabelOf(filter, translate),
      color: filter.chargeFilterId ? LANE_COLOR : DEFAULT_LANE_COLOR,
      values,
      sum: values.reduce((total, value) => total + value, 0),
      now: values.at(-1) || 0,
    }
  })

  return lanes.sort((a, b) => (sort === 'volume' ? b.sum - a.sum : a.label.localeCompare(b.label)))
}
