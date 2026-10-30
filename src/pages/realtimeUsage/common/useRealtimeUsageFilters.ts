import { DateTime } from 'luxon'
import { useSearchParams } from 'react-router'

import { formatFiltersForQuery } from '~/components/Filters/graphql/utils'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { TIME_RANGE_HOURS } from '~/components/realtimeUsage/constants'
import { ReportFetching } from '~/components/realtimeUsage/RealtimeUsageFetchingContext'
import { useRealtimeUsageClock } from '~/components/realtimeUsage/useRealtimeUsageClock'
import { isTimeRangePreset, windowStartOf } from '~/components/realtimeUsage/utils'
import { REALTIME_USAGE_FILTER_PREFIX } from '~/core/constants/filters'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { RealtimeUsageQueryFilters } from './types'
import { useRealtimeUsageControls } from './useRealtimeUsageControls'

type UseRealtimeUsageFilters = () => {
  filters: RealtimeUsageQueryFilters
  dimensionKeys?: string[]
  now: DateTime
  refresh: () => void
  reportFetching: ReportFetching
  isEnabled: boolean
}

export const useRealtimeUsageFilters: UseRealtimeUsageFilters = () => {
  const [searchParams] = useSearchParams()
  const { organization, timezone } = useOrganizationInfos()
  const { autoRefreshSeconds, timeRange } = useRealtimeUsageControls()

  const resetParams = new URLSearchParams(searchParams)

  resetParams.delete('page')

  const { now, tick, reportFetching } = useRealtimeUsageClock({
    autoRefreshSeconds,
    resetKey: resetParams.toString(),
  })

  const { dimensionKeys, ...filters } = formatFiltersForQuery<
    Pick<RealtimeUsageQueryFilters, 'externalCustomerId' | 'externalSubscriptionId'> & {
      dimensionKeys?: string[]
    }
  >({
    searchParams,
    availableFilters: [
      AvailableFiltersEnum.customerExternalId,
      AvailableFiltersEnum.subscriptionExternalId,
      AvailableFiltersEnum.realtimeDimensions,
    ],
    filtersNamePrefix: REALTIME_USAGE_FILTER_PREFIX,
    keyMap: {
      [AvailableFiltersEnum.customerExternalId]: 'externalCustomerId',
      [AvailableFiltersEnum.subscriptionExternalId]: 'externalSubscriptionId',
      [AvailableFiltersEnum.realtimeDimensions]: 'dimensionKeys',
    },
  })

  const getWindow = (): Pick<RealtimeUsageQueryFilters, 'fromDatetime' | 'toDatetime'> => {
    const nowISO = now.toUTC().toISO() || undefined

    if (isTimeRangePreset(timeRange)) {
      return {
        fromDatetime: windowStartOf(now, TIME_RANGE_HOURS[timeRange], timezone),
        toDatetime: nowISO,
      }
    }

    const [fromDatetime, toDatetime] = timeRange.split(',')

    // A range ending later than now would never refresh: it reads up to now instead.
    return {
      fromDatetime,
      toDatetime: DateTime.fromISO(toDatetime) > now ? nowISO : toDatetime,
    }
  }

  return {
    filters: { ...filters, ...getWindow() },
    dimensionKeys: dimensionKeys?.length ? dimensionKeys : undefined,
    now,
    refresh: tick,
    reportFetching,
    isEnabled: !!organization?.realtimeUsageEnabled,
  }
}
