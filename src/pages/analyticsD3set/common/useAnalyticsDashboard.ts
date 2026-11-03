import { useEffect, useState } from 'react'

import { AnalyticsApiError, fetchAnalyticsDashboard, getAnalyticsHeaders } from './api'
import { AnalyticsDashboard } from './types'

type DashboardState =
  | { status: 'loading' }
  | { status: 'ready'; dashboard: AnalyticsDashboard }
  | { status: 'error'; httpStatus: number | null }

export const useAnalyticsDashboard = (baseUrl: string): DashboardState => {
  const [state, setState] = useState<DashboardState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    setState({ status: 'loading' })
    fetchAnalyticsDashboard({ baseUrl, headers: getAnalyticsHeaders(), signal: controller.signal })
      .then((dashboard) => setState({ status: 'ready', dashboard }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          httpStatus: error instanceof AnalyticsApiError ? error.status : null,
        })
      })

    return () => controller.abort()
  }, [baseUrl])

  return state
}
