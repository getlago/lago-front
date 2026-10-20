import { useSearchParams } from 'react-router'

import {
  AUTO_REFRESH_SEARCH_PARAM,
  AutoRefreshEnum,
  DEFAULT_AUTO_REFRESH,
  DEFAULT_TIME_RANGE,
  TIME_RANGE_SEARCH_PARAM,
  TimeRangeEnum,
} from './constants'

export const isTimeRangePreset = (value?: string | null): value is TimeRangeEnum =>
  Object.values(TimeRangeEnum).includes(value as TimeRangeEnum)

const isAutoRefresh = (value?: string | null): value is AutoRefreshEnum =>
  Object.values(AutoRefreshEnum).includes(value as AutoRefreshEnum)

type UseRealtimeUsageControls = () => {
  autoRefresh: AutoRefreshEnum
  setAutoRefresh: (value: AutoRefreshEnum) => void
  // A preset, or the `from,to` ISO bounds of a custom range.
  timeRange: string
  setTimeRange: (value: string) => void
}

export const useRealtimeUsageControls: UseRealtimeUsageControls = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const autoRefreshParam = searchParams.get(AUTO_REFRESH_SEARCH_PARAM)
  const timeRangeParam = searchParams.get(TIME_RANGE_SEARCH_PARAM)

  const setParam = (key: string, value: string, defaultValue: string): void => {
    setSearchParams(
      (params) => {
        // The default stays out of the URL, so a plain link to the page means the defaults.
        if (value === defaultValue) {
          params.delete(key)
        } else {
          params.set(key, value)
        }

        // Another window has other periods and possibly fewer rows: start the lists over.
        if (key === TIME_RANGE_SEARCH_PARAM) params.delete('page')

        return params
      },
      { replace: true },
    )
  }

  return {
    autoRefresh: isAutoRefresh(autoRefreshParam) ? autoRefreshParam : DEFAULT_AUTO_REFRESH,
    setAutoRefresh: (value) => setParam(AUTO_REFRESH_SEARCH_PARAM, value, DEFAULT_AUTO_REFRESH),
    timeRange: timeRangeParam || DEFAULT_TIME_RANGE,
    setTimeRange: (value) => setParam(TIME_RANGE_SEARCH_PARAM, value, DEFAULT_TIME_RANGE),
  }
}
