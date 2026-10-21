import { useSearchParams } from 'react-router'

import { AUTO_REFRESH_OPTIONS, DEFAULT_AUTO_REFRESH } from '~/components/realtimeUsage/constants'

import {
  AUTO_REFRESH_SEARCH_PARAM,
  DEFAULT_TIME_RANGE,
  TIME_RANGE_SEARCH_PARAM,
  TimeRangeEnum,
} from './constants'
import { isApplicableRange } from './utils'

export const isTimeRangePreset = (value?: string | null): value is TimeRangeEnum =>
  Object.values(TimeRangeEnum).includes(value as TimeRangeEnum)

const timeRangeOf = (value: string | null): string => {
  if (isTimeRangePreset(value) || isApplicableRange(value)) return value

  return DEFAULT_TIME_RANGE
}

const autoRefreshOf = (value: string | null): number => {
  const seconds = Number(value)

  return AUTO_REFRESH_OPTIONS.includes(seconds) ? seconds : DEFAULT_AUTO_REFRESH
}

type UseRealtimeUsageControls = () => {
  autoRefreshSeconds: number
  setAutoRefreshSeconds: (seconds: number) => void
  // A preset, or the `from,to` ISO bounds of a custom range.
  timeRange: string
  setTimeRange: (value: string) => void
}

export const useRealtimeUsageControls: UseRealtimeUsageControls = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const setParam = (key: string, value: string, defaultValue: string): void => {
    setSearchParams(
      (params) => {
        if (value === defaultValue) {
          params.delete(key)
        } else {
          params.set(key, value)
        }

        if (key === TIME_RANGE_SEARCH_PARAM) params.delete('page')

        return params
      },
      { replace: true },
    )
  }

  return {
    autoRefreshSeconds: autoRefreshOf(searchParams.get(AUTO_REFRESH_SEARCH_PARAM)),
    setAutoRefreshSeconds: (seconds) =>
      setParam(AUTO_REFRESH_SEARCH_PARAM, String(seconds), String(DEFAULT_AUTO_REFRESH)),
    timeRange: timeRangeOf(searchParams.get(TIME_RANGE_SEARCH_PARAM)),
    setTimeRange: (value) => setParam(TIME_RANGE_SEARCH_PARAM, value, DEFAULT_TIME_RANGE),
  }
}
