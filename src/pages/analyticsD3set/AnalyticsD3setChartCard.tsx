import { Chart } from '@d3set/react'
import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { useMemo } from 'react'

import { Pagination } from '~/components/designSystem/Pagination'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import { buildChartParams } from './common/api'
import {
  buildChartSpec,
  CHART_HEIGHT,
  computeHeadline,
  Headline,
  humanizeField,
  SpecContext,
  toChartRows,
} from './common/specs'
import { lagoAnalyticsTheme } from './common/theme'
import { AnalyticsChart, AnalyticsFilter, AnalyticsFilterValues } from './common/types'
import { useChartRows } from './common/useChartRows'

export const ANALYTICS_D3SET_CHART_CARD_TEST_ID = 'analytics-d3set-chart-card'
export const ANALYTICS_D3SET_CHART_EMPTY_TEST_ID = 'analytics-d3set-chart-empty'
export const ANALYTICS_D3SET_CHART_ERROR_TEST_ID = 'analytics-d3set-chart-error'

const DATE_FORMATS: Record<string, string> = {
  day: 'LLL d, yyyy',
  week: 'LLL d, yyyy',
  month: 'LLL yyyy',
  quarter: "'Q'q yyyy",
  year: 'yyyy',
}

const formatDateFor =
  (format: string) =>
  (iso: string): string => {
    const date = DateTime.fromISO(iso, { zone: 'utc' })

    return date.isValid ? date.toFormat(format) : iso
  }

const isCurrency = (code: string | null): code is CurrencyEnum =>
  !!code && Object.values(CurrencyEnum).includes(code as CurrencyEnum)

const formatHeadline = (chart: AnalyticsChart, headline: Headline): string => {
  const integer = chart.metrics[0]?.format === ',d'

  if (isCurrency(headline.currency) && !integer) {
    return intlFormatNumber(headline.value, {
      currency: headline.currency,
      currencyDisplay: 'symbol',
    })
  }

  return intlFormatNumber(headline.value, {
    style: 'decimal',
    maximumFractionDigits: integer ? 0 : 2,
  })
}

type ChartCardProps = {
  baseUrl: string
  chart: AnalyticsChart
  filters: AnalyticsFilter[]
  values: AnalyticsFilterValues
  page: number
  onPageChange: (page: number) => void
}

export const AnalyticsD3setChartCard = ({
  baseUrl,
  chart,
  filters,
  values,
  page,
  onPageChange,
}: ChartCardProps) => {
  const { translate } = useInternationalization()
  const params = buildChartParams(chart, filters, values, page - 1)
  const { rows, total, status } = useChartRows({ baseUrl, chartId: chart.id, params })
  const granularity = values.granularity?.[0] ?? 'month'

  const context: SpecContext = useMemo(
    () => ({
      formatDate: formatDateFor(
        chart.viz === 'table'
          ? DATE_FORMATS.day
          : (DATE_FORMATS[granularity] ?? DATE_FORMATS.month),
      ),
      fieldLabel: humanizeField,
    }),
    [chart.viz, granularity],
  )
  const chartRows = useMemo(() => toChartRows(chart, rows, context), [chart, rows, context])
  const spec = useMemo(() => buildChartSpec(chart, chartRows, context), [chart, chartRows, context])
  const headline = useMemo(() => computeHeadline(chart, rows), [chart, rows])
  const isTable = chart.viz === 'table' || chart.viz === 'pivot'
  const pageSize = chart.viz === 'table' ? (chart.pageSize ?? 0) : 0

  const renderBody = () => {
    if (status === 'error' && !rows.length) {
      return (
        <div
          className="flex items-center justify-center"
          style={{ height: CHART_HEIGHT }}
          data-test={ANALYTICS_D3SET_CHART_ERROR_TEST_ID}
        >
          <Typography variant="caption" color="grey600">
            {translate('text_636d023ce11a9d038819b579')}
          </Typography>
        </div>
      )
    }

    if (status === 'loading' && !rows.length) {
      return (
        <div className="animate-pulse rounded-xl bg-grey-100" style={{ height: CHART_HEIGHT }} />
      )
    }

    if (!chartRows.length) {
      return (
        <div
          className={tw('flex items-center justify-center', { 'py-6': isTable })}
          style={{ height: isTable ? undefined : CHART_HEIGHT }}
          data-test={ANALYTICS_D3SET_CHART_EMPTY_TEST_ID}
        >
          <Typography variant="caption" color="grey600">
            {translate('text_17937029539402rs9rfdgywh')}
          </Typography>
        </div>
      )
    }

    return (
      <Chart
        className={tw('transition-opacity', { 'opacity-50': status === 'loading' })}
        spec={spec}
        rows={chartRows}
        theme={lagoAnalyticsTheme}
      />
    )
  }

  const renderHeadline = () => {
    if (!headline) return null

    const up = (headline.change ?? 0) >= 0

    return (
      <div className="flex flex-col gap-1">
        <Typography variant="headline" color="grey700">
          {formatHeadline(chart, headline)}
        </Typography>
        {headline.change !== null && (
          <div className="flex items-center gap-2">
            <Icon
              name={up ? 'arrow-up-circle-filled' : 'arrow-down-circle-filled'}
              color={up ? 'success' : 'error'}
            />
            <Typography variant="caption" color={up ? 'success600' : 'danger600'}>
              {intlFormatNumber(Math.abs(headline.change), {
                style: 'percent',
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography variant="caption" color="grey700">
              {translate('text_179370295394012b3cv2vr30')}
            </Typography>
          </div>
        )}
      </div>
    )
  }

  return (
    <section
      className={tw(
        'analytics-d3set-card flex min-w-0 flex-col gap-4 rounded-xl border border-grey-300 p-6',
        {
          'analytics-d3set-card--table': isTable,
          'analytics-d3set-card--single':
            chart.viz === 'area' && chart.series.length === 0 && chart.metrics.length === 1,
        },
      )}
      data-test={ANALYTICS_D3SET_CHART_CARD_TEST_ID}
      aria-label={chart.title}
    >
      <div className="flex flex-col gap-1">
        <Typography variant="subhead1" color="grey700">
          {chart.title}
        </Typography>
        {!!chart.description && (
          <Typography variant="caption" color="grey600">
            {chart.description}
          </Typography>
        )}
      </div>
      {renderHeadline()}
      {renderBody()}
      {chart.viz === 'table' && pageSize > 0 && total !== null && total > pageSize && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / pageSize)}
          totalCount={total}
          pageSize={pageSize}
          loading={status === 'loading'}
          onPageChange={onPageChange}
        />
      )}
    </section>
  )
}
