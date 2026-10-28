import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'

import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'

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
}

export const useRealtimeUsageClock: UseRealtimeUsageClock = ({
  autoRefreshSeconds,
  resetKey,
  hourlyTimezone,
}) => {
  const [now, setNow] = useState<DateTime>(() => DateTime.now())
  const [clockResetKey, setClockResetKey] = useState(resetKey)

  const tick = useCallback(() => setNow(DateTime.now()), [])

  if (clockResetKey !== resetKey) {
    setClockResetKey(resetKey)
    setNow(DateTime.now())
  }

  useEffect(() => {
    if (!autoRefreshSeconds) return

    const tickWhenVisible = (): void => {
      if (!document.hidden) tick()
    }

    const interval = setInterval(tickWhenVisible, autoRefreshSeconds * 1000)

    document.addEventListener('visibilitychange', tickWhenVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tickWhenVisible)
    }
  }, [autoRefreshSeconds, tick])

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

  return { now, tick }
}
