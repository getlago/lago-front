export type AnalyticsRow = Record<string, unknown>

export type AnalyticsMetric = {
  key: string
  label: string
  format: string | null
  currencyColumn?: string | null
}

export type AnalyticsColumn = {
  key: string
  label: string
  format: string | null
}

export type AnalyticsAxis = {
  key: string
  label: string
  temporal: boolean
}

export type AnalyticsPivot = {
  rows: string[]
  columns: string[]
  columnsDescending: boolean
}

type AnalyticsChartBase = {
  id: string
  title: string
  description?: string | null
  series: string[]
  metrics: AnalyticsMetric[]
}

export type AnalyticsXyChart = AnalyticsChartBase & {
  viz: 'bar' | 'area'
  x: AnalyticsAxis
  stacked: boolean
  horizontal: boolean
}

export type AnalyticsPivotChart = AnalyticsChartBase & {
  viz: 'pivot'
  pivot: AnalyticsPivot
}

export type AnalyticsTableChart = AnalyticsChartBase & {
  viz: 'table'
  columns: AnalyticsColumn[]
  pageSize: number
}

export type AnalyticsChart = AnalyticsXyChart | AnalyticsPivotChart | AnalyticsTableChart

export type AnalyticsLayoutCell = {
  chart: string
  width: number
}

export type AnalyticsView = {
  id: string
  title: string
  rows: AnalyticsLayoutCell[][]
}

export type AnalyticsTab = {
  id: string
  title: string
  views: AnalyticsView[]
}

export type AnalyticsFilter = {
  id: string
  name: string
  kind: 'time' | 'select'
  param: string
  multiple: boolean
  default: string | string[] | null
  tab: string
  charts: string[]
}

export type AnalyticsDashboard = {
  tabs: AnalyticsTab[]
  charts: Record<string, AnalyticsChart>
  filters: AnalyticsFilter[]
}

export type AnalyticsRowsMessage = {
  op: 'replace' | 'append' | 'upsert'
  rows: AnalyticsRow[]
  total?: number
}

export type AnalyticsFilterValues = Record<string, string[]>

export type AnalyticsParams = Record<string, string | string[]>
