import { sseSource } from 'd3set/core'
import { useEffect, useState } from 'react'

import { buildChartEventsUrl, getAnalyticsHeaders } from './api'
import { AnalyticsParams, AnalyticsRow, AnalyticsRowsMessage } from './types'

export type ChartRowsState = {
  rows: AnalyticsRow[]
  total: number | null
  status: 'loading' | 'ready' | 'error'
}

const INITIAL: ChartRowsState = { rows: [], total: null, status: 'loading' }

export const useChartRows = ({
  baseUrl,
  chartId,
  params,
}: {
  baseUrl: string
  chartId: string
  params: AnalyticsParams
}): ChartRowsState => {
  const [state, setState] = useState<ChartRowsState>(INITIAL)
  const paramsKey = JSON.stringify(params)

  useEffect(() => {
    let total: number | null = null
    let first = true

    // Keep the rows on screen until the new stream sends its first message.
    setState((previous) => ({ ...previous, status: 'loading' }))

    const source = sseSource({
      url: buildChartEventsUrl(baseUrl, chartId),
      headers: getAnalyticsHeaders(),
      params: JSON.parse(paramsKey) as AnalyticsParams,
      mode: 'replace',
      parse: (data: string) => {
        const message = JSON.parse(data) as AnalyticsRowsMessage

        total = typeof message.total === 'number' ? message.total : null

        return message
      },
    })
    const unsubscribe = source.subscribe((rows) => {
      if (first) {
        first = false

        return
      }
      setState({ rows: rows as AnalyticsRow[], total, status: 'ready' })
    })
    const offState = source.onState((sourceState) => {
      if (sourceState !== 'closed' && sourceState !== 'error') return
      setState((previous) =>
        previous.status === 'loading' ? { ...previous, status: 'error' } : previous,
      )
    })

    return () => {
      unsubscribe()
      offState()
      source.close()
    }
  }, [baseUrl, chartId, paramsKey])

  return state
}
