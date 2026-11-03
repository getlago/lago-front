import { areaChart, categoryBarChart, pivotChart, stackedBarChart, tableChart } from './fixtures'

import {
  buildChartSpec,
  CATEGORY_PAGE_SIZE,
  categoryPage,
  computeHeadline,
  hasCategoryPages,
  HORIZONTAL_LABEL_WIDTH,
  PIVOT_COLUMN_FIELD,
  PIVOT_ROW_FIELD,
  PIVOT_SUBROW_FIELD,
  SERIES_FIELD,
  SIGN_THRESHOLDS,
  SpecContext,
  toChartRows,
  VALUE_FIELD,
} from '../specs'

const context: SpecContext = {
  formatDate: (iso) => `d:${iso.slice(0, 7)}`,
  fieldLabel: (field) => field.toUpperCase(),
}

describe('analytics d3set specs', () => {
  describe('area over time', () => {
    const rows = [
      { month: '2026-01-01', active_subscriptions: 10 },
      { month: '2026-02-01', active_subscriptions: 12 },
    ]

    it('GIVEN one metric WHEN mapping THEN each row is one point of the metric series', () => {
      expect(toChartRows(areaChart, rows, context)).toEqual([
        { month: '2026-01-01', [SERIES_FIELD]: 'Active subscriptions', [VALUE_FIELD]: 10 },
        { month: '2026-02-01', [SERIES_FIELD]: 'Active subscriptions', [VALUE_FIELD]: 12 },
      ])
    })

    it('GIVEN an area chart WHEN building the spec THEN it uses the native chart look', () => {
      expect(buildChartSpec(areaChart, [], context)).toEqual({
        type: 'area',
        x: 'month',
        y: VALUE_FIELD,
        series: SERIES_FIELD,
        format: ',d',
        height: 232,
        aggregate: 'sum',
        stacked: false,
        options: {
          ticks: 'edges',
          valueAxis: 'right',
          curve: 'linear',
          gradient: true,
          axisFormat: 'short',
        },
      })
    })

    it('GIVEN two periods WHEN computing the headline THEN it is the last total and its change', () => {
      expect(computeHeadline(areaChart, rows)).toEqual({ value: 12, change: 0.2, currency: null })
    })
  })

  describe('stacked bars over time', () => {
    const rows = [
      { datetime: '2026-02-01', series: 'New', amount_currency: 'EUR', mrr_amount: 5 },
      { datetime: '2026-01-01', series: 'Churn', amount_currency: 'EUR', mrr_amount: '-2' },
      { datetime: '2026-01-01', series: 'New', amount_currency: 'EUR', mrr_amount: null },
    ]

    it('GIVEN series columns WHEN mapping THEN rows are sorted by date with a date label and a joined series name', () => {
      expect(toChartRows(stackedBarChart, rows, context)).toEqual([
        { datetime: 'd:2026-01', [SERIES_FIELD]: 'Churn · EUR', [VALUE_FIELD]: -2 },
        { datetime: 'd:2026-02', [SERIES_FIELD]: 'New · EUR', [VALUE_FIELD]: 5 },
      ])
    })

    it('GIVEN the mapped rows WHEN building the spec THEN it is a stacked band chart in date order', () => {
      const chartRows = toChartRows(stackedBarChart, rows, context)

      expect(buildChartSpec(stackedBarChart, chartRows, context)).toMatchObject({
        type: 'bar',
        stacked: true,
        horizontal: false,
        // Tooltips exact; the value axis short.
        format: ',.2~f',
        options: {
          axisFormat: 'short',
          valueAxis: 'right',
          ticks: 'edges',
          categories: 'd:2026-01|d:2026-02',
        },
      })
    })

    it('GIVEN rows in two currencies WHEN computing the headline THEN there is none', () => {
      expect(
        computeHeadline(stackedBarChart, [
          ...rows,
          { datetime: '2026-02-01', series: 'New', amount_currency: 'USD', mrr_amount: 1 },
        ]),
      ).toBeNull()
    })
  })

  it('GIVEN two metrics and no series WHEN mapping THEN each metric is a series, in the server order', () => {
    const rows = [
      { weekday: 'Mon', terminations: 3, plan_changes: 1 },
      { weekday: 'Tue', terminations: 2, plan_changes: 0 },
    ]
    const chartRows = toChartRows(categoryBarChart, rows, context)

    expect(chartRows.map((row) => row[SERIES_FIELD])).toEqual([
      'Terminations',
      'Plan changes',
      'Terminations',
      'Plan changes',
    ])
    expect(buildChartSpec(categoryBarChart, chartRows, context).options).toEqual({
      axisFormat: 'short',
      valueAxis: 'right',
      categories: 'Mon|Tue',
    })
  })

  it('GIVEN horizontal bars WHEN building the spec THEN the value axis stays at the bottom', () => {
    const chart = { ...categoryBarChart, horizontal: true, stacked: true }

    expect(buildChartSpec(chart, [], context)).toMatchObject({
      type: 'bar',
      horizontal: true,
      stacked: true,
      options: {},
    })
  })

  it('GIVEN horizontal bars WHEN building the spec THEN the labels get a wide column', () => {
    const chart = { ...categoryBarChart, horizontal: true }

    expect(buildChartSpec(chart, [], context).options).toMatchObject({
      labelWidth: HORIZONTAL_LABEL_WIDTH,
    })
  })

  describe('category pages', () => {
    const chart = { ...categoryBarChart, x: { key: 'plan', label: 'Plan', temporal: false } }
    // 25 plans, plan i with total i; plan 7 in two series.
    const rows = Array.from({ length: 25 }, (_, i) => ({
      plan: `plan ${i}`,
      [SERIES_FIELD]: 'USD',
      [VALUE_FIELD]: i,
    })).concat({ plan: 'plan 7', [SERIES_FIELD]: 'EUR', [VALUE_FIELD]: 100 })

    it('GIVEN a bar chart of categories WHEN deciding THEN it pages; bars over time do not', () => {
      expect(hasCategoryPages(chart)).toBe(true)
      expect(hasCategoryPages(stackedBarChart)).toBe(false)
      expect(hasCategoryPages(areaChart)).toBe(false)
    })

    it('GIVEN many categories WHEN paging THEN the largest totals come first, a page at a time', () => {
      const first = categoryPage(chart, rows, 1)

      expect(first.totalPages).toBe(3)
      expect(first.totalCount).toBe(25)
      const plans = Array.from(new Set(first.rows.map((row) => row.plan)))

      expect(plans).toHaveLength(CATEGORY_PAGE_SIZE)
      expect(plans.slice(0, 3)).toEqual(['plan 7', 'plan 24', 'plan 23'])
      // Both series of a category stay on its page.
      expect(first.rows.filter((row) => row.plan === 'plan 7')).toHaveLength(2)
      expect(new Set(categoryPage(chart, rows, 3).rows.map((row) => row.plan)).size).toBe(5)
    })

    it('GIVEN a page past the end WHEN paging THEN it shows the last one', () => {
      expect(categoryPage(chart, rows, 9).rows).toEqual(categoryPage(chart, rows, 3).rows)
    })
  })

  describe('pivot', () => {
    const rows = [
      { mrr_section: 'New', breakdown: 'EUR', datetime: '2026-01-01', mrr_amount: 4 },
      { mrr_section: 'Churn', breakdown: 'EUR', datetime: '2026-02-01', mrr_amount: -1 },
    ]

    it('GIVEN two row fields WHEN mapping THEN they become the row and sub-row of a long table', () => {
      expect(toChartRows(pivotChart, rows, context)).toEqual([
        {
          [PIVOT_ROW_FIELD]: 'New',
          [PIVOT_SUBROW_FIELD]: 'EUR',
          [PIVOT_COLUMN_FIELD]: '2026-01-01',
          [VALUE_FIELD]: 4,
        },
        {
          [PIVOT_ROW_FIELD]: 'Churn',
          [PIVOT_SUBROW_FIELD]: 'EUR',
          [PIVOT_COLUMN_FIELD]: '2026-02-01',
          [VALUE_FIELD]: -1,
        },
      ])
    })

    it('GIVEN negative values WHEN building the spec THEN it is a d3set pivot with newest columns first and sign colors', () => {
      const spec = buildChartSpec(pivotChart, toChartRows(pivotChart, rows, context), context)

      expect(spec).toMatchObject({
        type: 'table',
        x: PIVOT_ROW_FIELD,
        series: PIVOT_SUBROW_FIELD,
        y: VALUE_FIELD,
        aggregate: 'sum',
        options: { pivot: PIVOT_COLUMN_FIELD, swatch: true },
      })
      expect(spec.columns).toEqual([
        { field: PIVOT_ROW_FIELD, label: 'MRR_SECTION' },
        { field: PIVOT_SUBROW_FIELD, label: 'BREAKDOWN' },
        {
          field: '2026-02-01',
          label: 'd:2026-02',
          format: ',.2~f',
          align: 'right',
          thresholds: SIGN_THRESHOLDS,
        },
        {
          field: '2026-01-01',
          label: 'd:2026-01',
          format: ',.2~f',
          align: 'right',
          thresholds: SIGN_THRESHOLDS,
        },
      ])
    })
  })

  describe('table', () => {
    it('GIVEN contract columns WHEN building the spec THEN it shows them with cell formats and the page size', () => {
      expect(buildChartSpec(tableChart, [], context)).toEqual({
        type: 'table',
        limit: 10,
        columns: [
          { field: 'issuing_date', label: 'Issuing date' },
          { field: 'total_amount', label: 'Total amount', format: ',.2f' },
        ],
      })
    })

    it('GIVEN dates and booleans WHEN mapping THEN they read as text', () => {
      expect(
        toChartRows(tableChart, [{ issuing_date: '2026-03-04', is_overdue: true, n: 2 }], context),
      ).toEqual([{ issuing_date: 'd:2026-03', is_overdue: 'true', n: 2 }])
    })
  })
})
