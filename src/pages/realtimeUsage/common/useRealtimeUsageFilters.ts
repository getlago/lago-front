import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { formatFiltersForQuery } from '~/components/Filters/graphql/utils'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { REALTIME_USAGE_FILTER_PREFIX } from '~/core/constants/filters'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { TIME_RANGE_HOURS } from './constants'
import { RealtimeUsageQueryFilters } from './types'
import { isTimeRangePreset, useRealtimeUsageControls } from './useRealtimeUsageControls'
import { rollingWindowStartOf } from './utils'

const WINDOW_REFRESH_INTERVAL = 60000

type UseRealtimeUsageFilters = () => {
  filters: RealtimeUsageQueryFilters
  dimensionKeys?: string[]
  pollInterval: number
}

// What every report of the real-time usage pages asks for, read from the filters and the
// controls in the URL.
export const useRealtimeUsageFilters: UseRealtimeUsageFilters = () => {
  const [searchParams] = useSearchParams()
  const { timezoneConfig } = useOrganizationInfos()
  const [now, setNow] = useState<DateTime>(() => DateTime.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(DateTime.now()), WINDOW_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  const { dimensionKeys, ...filters } = formatFiltersForQuery<
    Pick<RealtimeUsageQueryFilters, 'externalCustomerId' | 'externalSubscriptionId'> & {
      dimensionKeys?: string[]
    }
  >({
    searchParams,
    availableFilters: [
      AvailableFiltersEnum.customerExternalId,
      AvailableFiltersEnum.realtimeSubscription,
      AvailableFiltersEnum.realtimeDimensions,
    ],
    filtersNamePrefix: REALTIME_USAGE_FILTER_PREFIX,
    keyMap: {
      [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
      [AvailableFiltersEnum.realtimeSubscription]: 'externalSubscriptionId',
      [AvailableFiltersEnum.realtimeDimensions]: 'dimensionKeys',
    },
  })

  const { autoRefresh, timeRange } = useRealtimeUsageControls()

  const getWindow = (): Pick<RealtimeUsageQueryFilters, 'fromDatetime' | 'toDatetime'> => {
    if (isTimeRangePreset(timeRange)) {
      // No end: the API reads up to now, so every poll gets the newest buckets.
      return {
        fromDatetime: rollingWindowStartOf(now, TIME_RANGE_HOURS[timeRange], timezoneConfig.name),
      }
    }

    const [fromDatetime, toDatetime] = timeRange.split(',')

    return { fromDatetime, toDatetime }
  }

  return {
    filters: { ...filters, ...getWindow() },
    dimensionKeys: dimensionKeys?.length ? dimensionKeys : undefined,
    pollInterval: (Number(autoRefresh) || 0) * 1000,
  }
}
