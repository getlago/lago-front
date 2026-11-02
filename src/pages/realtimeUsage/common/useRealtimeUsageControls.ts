import { useSearchParams } from 'react-router'

import { keyWithPrefix } from '~/components/Filters/graphql/utils'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import {
  AUTO_REFRESH_OPTIONS,
  DEFAULT_AUTO_REFRESH,
  DEFAULT_TIME_RANGE,
} from '~/components/realtimeUsage/constants'
import { isApplicableRange, isTimeRangePreset } from '~/components/realtimeUsage/utils'
import { REALTIME_USAGE_FILTER_PREFIX } from '~/core/constants/filters'

// A page setting rather than a filter: Reset and Apply leave it alone.
export const AUTO_REFRESH_SEARCH_PARAM = keyWithPrefix('autoRefresh', REALTIME_USAGE_FILTER_PREFIX)
export const TIME_RANGE_SEARCH_PARAM = keyWithPrefix(
  AvailableFiltersEnum.timeRange,
  REALTIME_USAGE_FILTER_PREFIX,
)

// What the filters panel puts in the URL before the user picks anything.
export const REALTIME_USAGE_STATIC_FILTERS = {
  [AvailableFiltersEnum.timeRange]: DEFAULT_TIME_RANGE,
}

const timeRangeOf = (value: string | null): string => {
  if (isTimeRangePreset(value) || isApplicableRange(value)) return value

  return DEFAULT_TIME_RANGE
}

const autoRefreshOf = (value: string | null): number => {
  // `Number(null)` is 0, which would read a missing param as Off rather than the default.
  if (value === null) return DEFAULT_AUTO_REFRESH

  const seconds = Number(value)

  return AUTO_REFRESH_OPTIONS.includes(seconds) ? seconds : DEFAULT_AUTO_REFRESH
}

type UseRealtimeUsageControls = () => {
  autoRefreshSeconds: number
  setAutoRefreshSeconds: (seconds: number) => void
  timeRange: string
}

export const useRealtimeUsageControls: UseRealtimeUsageControls = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const setAutoRefreshSeconds = (seconds: number): void => {
    setSearchParams(
      (params) => {
        if (seconds === DEFAULT_AUTO_REFRESH) params.delete(AUTO_REFRESH_SEARCH_PARAM)
        else params.set(AUTO_REFRESH_SEARCH_PARAM, String(seconds))

        return params
      },
      { replace: true },
    )
  }

  return {
    autoRefreshSeconds: autoRefreshOf(searchParams.get(AUTO_REFRESH_SEARCH_PARAM)),
    setAutoRefreshSeconds,
    timeRange: timeRangeOf(searchParams.get(TIME_RANGE_SEARCH_PARAM)),
  }
}
