import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'

import { ReportFetching } from './RealtimeUsageFetchingContext'

// Failed reads in a row after which auto-refresh gives up and leaves the error on screen.
export const MAX_AUTO_REFRESH_FAILURES = 3

type UseRealtimeUsageClockParams = {
  autoRefreshSeconds: number
  resetKey?: string
}

type UseRealtimeUsageClock = (params: UseRealtimeUsageClockParams) => {
  now: DateTime
  tick: () => void
  reportFetching: ReportFetching
}

export const useRealtimeUsageClock: UseRealtimeUsageClock = ({ autoRefreshSeconds, resetKey }) => {
  const [now, setNow] = useState<DateTime>(() => DateTime.now())
  const [clockResetKey, setClockResetKey] = useState(resetKey)

  const [fetchingIds, setFetchingIds] = useState<ReadonlySet<string>>(() => new Set())
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(() => new Set())
  // Auto-refreshes that retried a failed read and failed again.
  const [failedRetries, setFailedRetries] = useState(0)
  const [retriesAutoRefreshSeconds, setRetriesAutoRefreshSeconds] = useState(autoRefreshSeconds)

  // A manual refresh starts the backoff over.
  const tick = useCallback(() => {
    setFailedRetries(0)
    setNow(DateTime.now())
  }, [])

  const reportFetching = useCallback<ReportFetching>((id, isFetching, hasError = false) => {
    setFetchingIds((ids) => toggleId(ids, id, isFetching))
    setFailedIds((ids) => toggleId(ids, id, hasError))
  }, [])

  const isFetching = fetchingIds.size > 0
  const hasError = failedIds.size > 0
  const consecutiveFailures = hasError ? failedRetries + 1 : 0

  if (clockResetKey !== resetKey) {
    setClockResetKey(resetKey)
    setFailedRetries(0)
    setNow(DateTime.now())
  }

  if (retriesAutoRefreshSeconds !== autoRefreshSeconds) {
    setRetriesAutoRefreshSeconds(autoRefreshSeconds)
    setFailedRetries(0)
  }

  // Not an interval: a tick during a read aborts it in the browser, yet ClickHouse still runs it.
  // On error it backs off (2x, 4x the interval), then stops: the error stays until a manual refresh.
  useEffect(() => {
    if (!autoRefreshSeconds || isFetching) return
    if (consecutiveFailures >= MAX_AUTO_REFRESH_FAILURES) return

    const tickWhenVisible = (): void => {
      if (document.hidden) return

      setFailedRetries(hasError ? (retries) => retries + 1 : 0)
      setNow(DateTime.now())
    }

    const delay = autoRefreshSeconds * 1000 * 2 ** consecutiveFailures
    const timeout = setTimeout(tickWhenVisible, delay)

    document.addEventListener('visibilitychange', tickWhenVisible)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', tickWhenVisible)
    }
  }, [autoRefreshSeconds, isFetching, hasError, consecutiveFailures, now])

  return { now, tick, reportFetching }
}

const toggleId = (ids: ReadonlySet<string>, id: string, isIn: boolean): ReadonlySet<string> => {
  if (ids.has(id) === isIn) return ids

  const next = new Set(ids)

  if (isIn) next.add(id)
  else next.delete(id)

  return next
}
