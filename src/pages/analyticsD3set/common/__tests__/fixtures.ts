import {
  AnalyticsDashboard,
  AnalyticsFilter,
  AnalyticsPivotChart,
  AnalyticsTableChart,
  AnalyticsXyChart,
} from '../types'

export const areaChart: AnalyticsXyChart = {
  id: 'chart-area',
  title: 'Active subscriptions over time',
  viz: 'area',
  x: { key: 'month', label: 'Month', temporal: true },
  series: [],
  metrics: [{ key: 'active_subscriptions', label: 'Active subscriptions', format: ',d' }],
  stacked: false,
  horizontal: false,
}

export const stackedBarChart: AnalyticsXyChart = {
  id: 'chart-bar',
  title: 'MRR overview',
  viz: 'bar',
  x: { key: 'datetime', label: 'Date', temporal: true },
  series: ['series', 'amount_currency'],
  metrics: [{ key: 'mrr_amount', label: 'Mrr amount', format: 'SMART_NUMBER' }],
  stacked: true,
  horizontal: false,
}

export const categoryBarChart: AnalyticsXyChart = {
  id: 'chart-weekday',
  title: 'Day of terminations',
  viz: 'bar',
  x: { key: 'weekday', label: 'Weekday', temporal: false },
  series: [],
  metrics: [
    { key: 'terminations', label: 'Terminations', format: ',d' },
    { key: 'plan_changes', label: 'Plan changes', format: ',d' },
  ],
  stacked: false,
  horizontal: false,
}

export const pivotChart: AnalyticsPivotChart = {
  id: 'chart-pivot',
  title: 'MRR details',
  viz: 'pivot',
  series: [],
  metrics: [{ key: 'mrr_amount', label: 'Mrr amount', format: 'SMART_NUMBER' }],
  pivot: { rows: ['mrr_section', 'breakdown'], columns: ['datetime'], columnsDescending: true },
}

export const tableChart: AnalyticsTableChart = {
  id: 'chart-table',
  title: 'Invoice list',
  viz: 'table',
  series: [],
  metrics: [],
  columns: [
    { key: 'issuing_date', label: 'Issuing date', format: null },
    { key: 'total_amount', label: 'Total amount', format: 'CURRENCY' },
  ],
  pageSize: 10,
}

export const timeFilter: AnalyticsFilter = {
  id: 'NATIVE_FILTER-date',
  name: 'Date range',
  kind: 'time',
  param: 'time',
  multiple: false,
  default: null,
  tab: 'TAB-Subscriptions',
  charts: ['chart-area', 'chart-table'],
}

export const currencyFilter: AnalyticsFilter = {
  id: 'NATIVE_FILTER-currency',
  name: 'Currency',
  kind: 'select',
  param: 'amount_currency',
  multiple: true,
  default: null,
  tab: 'TAB-SubsActive',
  charts: ['chart-area'],
}

export const granularityFilter: AnalyticsFilter = {
  id: 'NATIVE_FILTER-granularity',
  name: 'Granularity',
  kind: 'select',
  param: 'granularity',
  multiple: false,
  default: 'month',
  tab: 'TAB-Revenue',
  charts: ['chart-bar'],
}

export const dashboard: AnalyticsDashboard = {
  tabs: [
    {
      id: 'TAB-Subscriptions',
      title: 'Subscriptions',
      views: [
        {
          id: 'TAB-SubsActive',
          title: 'Active subscriptions',
          rows: [[{ chart: 'chart-area', width: 12 }], [{ chart: 'chart-table', width: 12 }]],
        },
        { id: 'TAB-SubsNew', title: 'New subscriptions', rows: [] },
      ],
    },
    {
      id: 'TAB-Revenue',
      title: 'Revenue',
      views: [{ id: 'TAB-Revenue', title: 'Revenue', rows: [[{ chart: 'chart-bar', width: 6 }]] }],
    },
  ],
  charts: {
    'chart-area': areaChart,
    'chart-bar': stackedBarChart,
    'chart-table': tableChart,
  },
  filters: [timeFilter, currencyFilter, granularityFilter],
}
