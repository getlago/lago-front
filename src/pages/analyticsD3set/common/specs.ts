import type { ChartSpec, ColumnSpec, Threshold } from 'd3set/core'

import {
  AnalyticsChart,
  AnalyticsMetric,
  AnalyticsPivotChart,
  AnalyticsRow,
  AnalyticsTableChart,
  AnalyticsXyChart,
} from './types'

export const SERIES_FIELD = '__series'
export const VALUE_FIELD = '__value'
export const PIVOT_ROW_FIELD = '__row'
export const PIVOT_SUBROW_FIELD = '__subrow'
export const PIVOT_COLUMN_FIELD = '__column'

export const CHART_HEIGHT = 232
/** Categories a bar chart shows at once: more would not leave room to read their labels. */
export const CATEGORY_PAGE_SIZE = 10
/** The label column of a horizontal bar chart: room for a plan or customer name. */
export const HORIZONTAL_LABEL_WIDTH = 200
const LABEL_SEPARATOR = ' · '
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/

const POSITIVE_COLOR = '#008559'
const NEGATIVE_COLOR = '#DC3309'
const ZERO_COLOR = '#8C95A6'

export const SIGN_THRESHOLDS: Threshold[] = [
  { op: '>', value: 0, color: POSITIVE_COLOR },
  { op: '<', value: 0, color: NEGATIVE_COLOR },
  { op: '=', value: 0, color: ZERO_COLOR },
]

export type SpecContext = {
  formatDate: (iso: string) => string
  fieldLabel: (field: string) => string
}

export const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && ISO_DATE.test(value)

/** A d3-format for an axis or a tooltip. `SMART_NUMBER` and `CURRENCY` are Superset's own names. */
export const axisFormat = (format: string | null | undefined): string => {
  if (!format || format === 'SMART_NUMBER' || format === 'CURRENCY') return '.3~s'

  return format
}

export const cellFormat = (format: string | null | undefined): string | undefined => {
  if (format === 'SMART_NUMBER') return ',.2~f'
  if (format === 'CURRENCY') return ',.2f'

  return format || undefined
}

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined

  const number = Number(value)

  return Number.isFinite(number) ? number : undefined
}

const seriesName = (
  chart: AnalyticsXyChart,
  metric: AnalyticsMetric,
  row: AnalyticsRow,
): string => {
  const parts = [
    ...(chart.metrics.length > 1 ? [metric.label] : []),
    ...chart.series.map((field) => String(row[field] ?? '')),
  ]

  return parts.length ? parts.join(LABEL_SEPARATOR) : metric.label
}

const byIsoX =
  (field: string) =>
  (a: AnalyticsRow, b: AnalyticsRow): number =>
    String(a[field] ?? '').localeCompare(String(b[field] ?? ''))

export const toXyRows = (
  chart: AnalyticsXyChart,
  rows: AnalyticsRow[],
  context?: SpecContext,
): AnalyticsRow[] => {
  const labelX = chart.x.temporal && chart.viz === 'bar' && context
  const ordered = labelX ? [...rows].sort(byIsoX(chart.x.key)) : rows

  return ordered.flatMap((row) =>
    chart.metrics.flatMap((metric) => {
      const value = toNumber(row[metric.key])
      const x = row[chart.x.key]

      if (value === undefined) return []

      return [
        {
          [chart.x.key]: labelX && isIsoDate(x) ? context.formatDate(x) : x,
          [SERIES_FIELD]: seriesName(chart, metric, row),
          [VALUE_FIELD]: value,
        },
      ]
    }),
  )
}

export const toPivotRows = (chart: AnalyticsPivotChart, rows: AnalyticsRow[]): AnalyticsRow[] => {
  const [first, ...rest] = chart.pivot.rows
  const withMetric = chart.metrics.length > 1

  return rows.flatMap((row) =>
    chart.metrics.flatMap((metric) => {
      const value = toNumber(row[metric.key])

      if (value === undefined) return []

      const subrow = [
        ...rest.map((field) => String(row[field] ?? '')),
        ...(withMetric && chart.pivot.columns.length ? [metric.label] : []),
      ]
      const column = chart.pivot.columns.length
        ? chart.pivot.columns.map((field) => String(row[field] ?? '')).join(LABEL_SEPARATOR)
        : metric.label

      return [
        {
          [PIVOT_ROW_FIELD]: first ? String(row[first] ?? '') : metric.label,
          ...(subrow.length ? { [PIVOT_SUBROW_FIELD]: subrow.join(LABEL_SEPARATOR) } : {}),
          [PIVOT_COLUMN_FIELD]: column,
          [VALUE_FIELD]: value,
        },
      ]
    }),
  )
}

export const toTableRows = (rows: AnalyticsRow[], context: SpecContext): AnalyticsRow[] =>
  rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (isIsoDate(value)) return [key, context.formatDate(value)]
        if (typeof value === 'boolean') return [key, String(value)]

        return [key, value]
      }),
    ),
  )

export const toChartRows = (
  chart: AnalyticsChart,
  rows: AnalyticsRow[],
  context: SpecContext,
): AnalyticsRow[] => {
  if (chart.viz === 'pivot') return toPivotRows(chart, rows)
  if (chart.viz === 'table') return toTableRows(rows, context)

  return toXyRows(chart, rows, context)
}

const distinct = (values: unknown[]): string[] => Array.from(new Set(values.map(String)))

/** A bar chart of categories (not of dates): its categories can be too many to read at once. */
export const hasCategoryPages = (chart: AnalyticsChart): chart is AnalyticsXyChart =>
  chart.viz === 'bar' && !!chart.x && !(chart.x.temporal && !chart.horizontal)

/**
 * One page of a category bar chart: its categories sorted by total, largest first (as Superset
 * sorts them), `CATEGORY_PAGE_SIZE` per page, and the rows of those categories only.
 */
export const categoryPage = (
  chart: AnalyticsXyChart,
  rows: AnalyticsRow[],
  page: number,
): { rows: AnalyticsRow[]; totalPages: number; totalCount: number } => {
  const totals = new Map<string, number>()

  for (const row of rows) {
    const key = String(row[chart.x.key])

    totals.set(key, (totals.get(key) ?? 0) + (Number(row[VALUE_FIELD]) || 0))
  }
  const ordered = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key)
  const totalPages = Math.max(1, Math.ceil(ordered.length / CATEGORY_PAGE_SIZE))
  const current = Math.min(Math.max(page, 1), totalPages)
  const shown = new Set(
    ordered.slice((current - 1) * CATEGORY_PAGE_SIZE, current * CATEGORY_PAGE_SIZE),
  )
  // In the page's order: the chart keeps the order of the categories it receives.
  const index = new Map(ordered.map((key, i) => [key, i]))
  const pageRows = rows
    .filter((row) => shown.has(String(row[chart.x.key])))
    .sort(
      (a, b) => (index.get(String(a[chart.x.key])) ?? 0) - (index.get(String(b[chart.x.key])) ?? 0),
    )

  return { rows: pageRows, totalPages, totalCount: ordered.length }
}

const xySpec = (chart: AnalyticsXyChart, rows: AnalyticsRow[]): ChartSpec => {
  const base = {
    x: chart.x.key,
    y: VALUE_FIELD,
    series: SERIES_FIELD,
    format: axisFormat(chart.metrics[0]?.format),
    height: CHART_HEIGHT,
  }

  if (chart.x.temporal && chart.viz === 'area') {
    return {
      ...base,
      type: 'area',
      aggregate: 'sum',
      stacked: chart.stacked,
      options: { ticks: 'edges', valueAxis: 'right', curve: 'linear', gradient: true },
    }
  }

  const categories = distinct(rows.map((row) => row[chart.x.key]))
  const keepOrder = categories.length > 0 && categories.every((value) => !value.includes('|'))

  // Over time, bars are bands, not `timeseries`: it has no month-long bucket, so its last bar overflows.
  const overTime = chart.x.temporal && !chart.horizontal

  return {
    ...base,
    type: chart.viz === 'area' ? 'area' : 'bar',
    aggregate: 'sum',
    stacked: chart.stacked,
    horizontal: chart.horizontal,
    options: {
      ...(chart.horizontal ? { labelWidth: HORIZONTAL_LABEL_WIDTH } : { valueAxis: 'right' }),
      ...(overTime ? { ticks: 'edges' } : {}),
      ...(keepOrder && chart.viz === 'bar' ? { categories: categories.join('|') } : {}),
    },
  }
}

const pivotSpec = (
  chart: AnalyticsPivotChart,
  rows: AnalyticsRow[],
  context: SpecContext,
): ChartSpec => {
  const format = cellFormat(chart.metrics[0]?.format) ?? ',.2~f'
  const thresholds = rows.some((row) => Number(row[VALUE_FIELD]) < 0) ? SIGN_THRESHOLDS : undefined
  const values = distinct(rows.map((row) => row[PIVOT_COLUMN_FIELD])).sort()
  const ordered = chart.pivot.columnsDescending ? values.reverse() : values
  const [first, ...rest] = chart.pivot.rows
  const hasSubrow = rows.some((row) => row[PIVOT_SUBROW_FIELD] !== undefined)
  const keyColumns: ColumnSpec[] = [
    { field: PIVOT_ROW_FIELD, label: first ? context.fieldLabel(first) : '' },
    ...(hasSubrow
      ? [{ field: PIVOT_SUBROW_FIELD, label: rest.map(context.fieldLabel).join(LABEL_SEPARATOR) }]
      : []),
  ]

  return {
    type: 'table',
    x: PIVOT_ROW_FIELD,
    ...(hasSubrow ? { series: PIVOT_SUBROW_FIELD } : {}),
    y: VALUE_FIELD,
    aggregate: 'sum',
    format,
    limit: 1000,
    options: { pivot: PIVOT_COLUMN_FIELD, swatch: true },
    columns: [
      ...keyColumns,
      ...ordered.map((value) => ({
        field: value,
        label: isIsoDate(value) ? context.formatDate(value) : value,
        format,
        align: 'right' as const,
        ...(thresholds ? { thresholds } : {}),
      })),
    ],
  }
}

const tableSpec = (chart: AnalyticsTableChart): ChartSpec => ({
  type: 'table',
  limit: chart.pageSize,
  columns: chart.columns.map((column) => {
    const format = cellFormat(column.format)

    return { field: column.key, label: column.label, ...(format ? { format } : {}) }
  }),
})

export const buildChartSpec = (
  chart: AnalyticsChart,
  rows: AnalyticsRow[],
  context: SpecContext,
): ChartSpec => {
  if (chart.viz === 'pivot') return pivotSpec(chart, rows, context)
  if (chart.viz === 'table') return tableSpec(chart)

  return xySpec(chart, rows)
}

export type Headline = { value: number; change: number | null; currency: string | null }

const currencyFields = (chart: AnalyticsXyChart): string[] =>
  Array.from(
    new Set([
      ...chart.series.filter((field) => /currency/i.test(field)),
      ...chart.metrics.flatMap((metric) => (metric.currencyColumn ? [metric.currencyColumn] : [])),
    ]),
  )

// None when the rows mix currencies: a sum across currencies means nothing.
export const computeHeadline = (chart: AnalyticsChart, rows: AnalyticsRow[]): Headline | null => {
  if (chart.viz !== 'bar' && chart.viz !== 'area') return null
  if (!chart.x.temporal || !rows.length) return null

  const currencies = currencyFields(chart).map((field) => distinct(rows.map((row) => row[field])))

  if (currencies.some((values) => values.length > 1)) return null

  const totals = new Map<string, number>()

  rows.forEach((row) => {
    const x = String(row[chart.x.key])
    const sum = chart.metrics.reduce((acc, metric) => acc + (toNumber(row[metric.key]) ?? 0), 0)

    totals.set(x, (totals.get(x) ?? 0) + sum)
  })
  const xs = Array.from(totals.keys()).sort()
  const value = totals.get(xs[xs.length - 1]) ?? 0
  const previous = xs.length > 1 ? totals.get(xs[xs.length - 2]) : undefined
  const change = previous ? (value - previous) / Math.abs(previous) : null

  return { value, change, currency: currencies[0]?.[0] ?? null }
}

export const humanizeField = (field: string): string => {
  const text = field.replace(/_/g, ' ').trim()

  return text.charAt(0).toUpperCase() + text.slice(1)
}
