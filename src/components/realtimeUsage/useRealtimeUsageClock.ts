import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'

import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'

import { ReportFetching } from './RealtimeUsageFetchingContext'

type UseRealtimeUsageClockParams = {
  autoRefreshSeconds: number
  // Changes when the view reads something else, so its window ends now again.
  resetKey?: string
  // With auto-refresh Off, still ticks on each hour wall of this timezone.
  hourlyTimezone?: TimezoneEnum
}

type UseRealtimeUsageClock = (params: UseRealtimeUsageClockParams) => {
  now: DateTime
  tick: () => void
  reportFetching: ReportFetching
}

export const useRealtimeUsageClock: UseRealtimeUsageClock = ({
  autoRefreshSeconds,
  resetKey,
  hourlyTimezone,
}) => {
  const [now, setNow] = useState<DateTime>(() => DateTime.now())
  const [clockResetKey, setClockResetKey] = useState(resetKey)

  const [fetchingIds, setFetchingIds] = useState<ReadonlySet<string>>(() => new Set())

  const tick = useCallback(() => setNow(DateTime.now()), [])

  const reportFetching = useCallback<ReportFetching>((id, isFetching) => {
    setFetchingIds((ids) => {
      if (ids.has(id) === isFetching) return ids

      const next = new Set(ids)

      if (isFetching) next.add(id)
      else next.delete(id)

      return next
    })
  }, [])

  const isFetching = fetchingIds.size > 0

  if (clockResetKey !== resetKey) {
    setClockResetKey(resetKey)
    setNow(DateTime.now())
  }

  // Not an interval: a tick during a read aborts it in the browser, yet ClickHouse still runs it.
  useEffect(() => {
    if (!autoRefreshSeconds || isFetching) return

    const tickWhenVisible = (): void => {
      if (!document.hidden) tick()
    }

    const timeout = setTimeout(tickWhenVisible, autoRefreshSeconds * 1000)

    document.addEventListener('visibilitychange', tickWhenVisible)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', tickWhenVisible)
    }
  }, [autoRefreshSeconds, isFetching, now, tick])

  useEffect(() => {
    if (autoRefreshSeconds || !hourlyTimezone) return

    const zone = getTimezoneConfig(hourlyTimezone).name
    let timeout: ReturnType<typeof setTimeout>

    const scheduleNextHour = (): void => {
      const nextHour = DateTime.now().setZone(zone).plus({ hours: 1 }).startOf('hour')

      timeout = setTimeout(() => {
        tick()
        scheduleNextHour()
      }, nextHour.diffNow().toMillis())
    }

    scheduleNextHour()

    return () => clearTimeout(timeout)
  }, [autoRefreshSeconds, hourlyTimezone, tick])

  return { now, tick, reportFetching }
}
