import { buildAuthHeaders } from '~/core/apolloClient/authHeaders'

import {
  AnalyticsChart,
  AnalyticsDashboard,
  AnalyticsFilter,
  AnalyticsFilterValues,
  AnalyticsParams,
} from './types'

export class AnalyticsApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AnalyticsApiError'
    this.status = status
  }
}

export const getAnalyticsHeaders = (
  pathname: string = window.location.pathname,
): Record<string, string> => buildAuthHeaders(pathname)

export const buildAnalyticsUrl = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/api${path}`

// `stream`, not `events`: ad blockers block `/event` URLs on an `analytics.` host (EasyPrivacy).
export const buildChartEventsUrl = (baseUrl: string, chartId: string): string =>
  buildAnalyticsUrl(baseUrl, `/charts/${encodeURIComponent(chartId)}/stream`)

const appendParams = (url: string, params: AnalyticsParams): string => {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    ;(Array.isArray(value) ? value : [value]).forEach((item) => search.append(key, item))
  })
  const query = search.toString()

  return query ? `${url}?${query}` : url
}

const filterParams = (
  filters: AnalyticsFilter[],
  values: AnalyticsFilterValues,
): AnalyticsParams => {
  return filters.reduce<AnalyticsParams>((acc, filter) => {
    const value = (values[filter.param] ?? []).filter((item) => item !== '')

    if (!value.length) return acc
    if (filter.kind === 'time' || !filter.multiple) return { ...acc, [filter.param]: value[0] }

    return { ...acc, [filter.param]: value }
  }, {})
}

export const buildChartParams = (
  chart: AnalyticsChart,
  filters: AnalyticsFilter[],
  values: AnalyticsFilterValues,
  page?: number,
): AnalyticsParams => {
  const params = filterParams(
    filters.filter((filter) => filter.charts.includes(chart.id)),
    values,
  )

  if (chart.viz === 'table' && chart.pageSize) return { ...params, page: String(page ?? 0) }

  return params
}

export const buildFilterOptionsParams = (
  filter: AnalyticsFilter,
  filters: AnalyticsFilter[],
  values: AnalyticsFilterValues,
): AnalyticsParams =>
  filterParams(
    filters.filter((other) => other.param !== filter.param),
    values,
  )

const readJson = async <T>(response: Response): Promise<T> => {
  if (response.ok) return (await response.json()) as T

  let message = response.statusText

  try {
    const body = (await response.json()) as { error?: string }

    message = body.error || message
  } catch {
    // The body is not JSON: keep the status text.
  }

  throw new AnalyticsApiError(response.status, message)
}

export const fetchAnalyticsDashboard = async ({
  baseUrl,
  headers,
  signal,
}: {
  baseUrl: string
  headers: Record<string, string>
  signal?: AbortSignal
}): Promise<AnalyticsDashboard> => {
  const response = await fetch(buildAnalyticsUrl(baseUrl, '/dashboard'), { headers, signal })

  return readJson<AnalyticsDashboard>(response)
}

export const fetchAnalyticsFilterOptions = async ({
  baseUrl,
  filterId,
  params,
  headers,
  signal,
}: {
  baseUrl: string
  filterId: string
  params: AnalyticsParams
  headers: Record<string, string>
  signal?: AbortSignal
}): Promise<string[]> => {
  const url = appendParams(
    buildAnalyticsUrl(baseUrl, `/filters/${encodeURIComponent(filterId)}/options`),
    params,
  )
  const response = await fetch(url, { headers, signal })
  const body = await readJson<{ values: unknown[] }>(response)

  return body.values.map((value) => String(value))
}
