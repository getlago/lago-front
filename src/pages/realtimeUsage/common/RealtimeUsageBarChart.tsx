import { gql } from '@apollo/client'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { useAnalyticsState } from '~/components/analytics/AnalyticsStateContext'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { StackedSegment } from '~/components/subscriptions/realtimeUsage/graph/StackedSegment'
import { UsageTooltip } from '~/components/subscriptions/realtimeUsage/graph/UsageTooltip'
import { bigNumberShortenNotation } from '~/core/formats/intlFormatNumber'
import { RealtimeUsageBarChartReportFragment, TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import {
  CHART_HEIGHT,
  REALTIME_USAGE_BAR_CHART_LEGEND_TEST_ID,
  REALTIME_USAGE_BAR_CHART_TEST_ID,
} from './constants'
import { PeriodPoint } from './types'
import { buildSeriesAndPoints, formatPeriod } from './utils'

gql`
  fragment RealtimeUsageBarChartReport on RealtimeUsageBillableMetric {
    timeGranularity
    timezone
    dimensions {
      key
      name
      other
    }
    points {
      time
      breakdown {
        dimensionKey
        units
      }
    }
  }
`

type SegmentProps = {
  index?: number
  hoverIndex?: number
  payload?: PeriodPoint
  seriesKey?: string
  seriesKeys?: string[]
}

// The hovered period stays in full color while the others fade, as the table under the chart
// highlights the same column.
const DimmableSegment = ({ index, hoverIndex, ...props }: SegmentProps): JSX.Element => (
  <g opacity={hoverIndex === undefined || hoverIndex === index ? 1 : 0.3}>
    <StackedSegment {...props} />
  </g>
)

type RealtimeUsageBarChartProps = {
  report?: RealtimeUsageBarChartReportFragment
  loading: boolean
  height?: number
}

export const RealtimeUsageBarChart = ({
  report,
  loading,
  height = CHART_HEIGHT,
}: RealtimeUsageBarChartProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { hoverDataIndex, setHoverDataIndex, setClickedDataIndex, handleMouseLeave } =
    useAnalyticsState()

  const { series, points } = useMemo(
    () => buildSeriesAndPoints(report, translate),
    [report, translate],
  )

  if (loading && !report) {
    return (
      <div className="flex flex-col justify-end gap-3" style={{ height }}>
        <Skeleton variant="text" className="w-40" />
        <Skeleton variant="text" className="w-full" />
      </div>
    )
  }

  const timezone = report?.timezone || TimezoneEnum.TzUtc
  const granularity = report?.timeGranularity
  const format = (time: string): string =>
    granularity ? formatPeriod(time, granularity, timezone) : time
  const seriesKeys = series.map((serie) => serie.key)
  const firstTime = points[0]?.time
  const lastTime = points[points.length - 1]?.time

  return (
    <div className="flex flex-col gap-4" data-test={REALTIME_USAGE_BAR_CHART_TEST_ID}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={points}
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
          onMouseMove={(event) => {
            if (typeof event?.activeTooltipIndex === 'number') {
              setHoverDataIndex(event.activeTooltipIndex)
            }
          }}
          onClick={(event) => {
            if (typeof event?.activeTooltipIndex === 'number') {
              setClickedDataIndex(event.activeTooltipIndex)
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          <XAxis
            dataKey="time"
            axisLine={{ stroke: theme.palette.grey[300] }}
            tickLine={false}
            ticks={firstTime && lastTime ? [firstTime, lastTime] : []}
            interval={0}
            tick={{ fill: theme.palette.grey[600], fontSize: 12 }}
            tickFormatter={format}
          />
          <YAxis
            orientation="right"
            axisLine={false}
            tickLine={false}
            width={48}
            tickCount={2}
            domain={[0, 'dataMax']}
            tick={{ fill: theme.palette.grey[600], fontSize: 12 }}
            tickFormatter={(value: number) => bigNumberShortenNotation(value)}
          />
          <RechartTooltip
            cursor={false}
            content={({ active, payload }) => (
              <UsageTooltip
                active={!!active}
                point={payload?.[0]?.payload}
                series={series}
                unitLabel={translate('text_1787607502687zc1gdrqwnzj')}
                formatHour={format}
              />
            )}
          />
          {series.map((serie) => (
            <Bar
              key={`realtime-usage-bar-${serie.key}`}
              dataKey={serie.key}
              stackId="usage"
              fill={serie.color}
              maxBarSize={24}
              isAnimationActive={false}
              shape={
                <DimmableSegment
                  hoverIndex={hoverDataIndex}
                  seriesKey={serie.key}
                  seriesKeys={seriesKeys}
                />
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {series.length > 1 && (
        <div
          className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2"
          data-test={REALTIME_USAGE_BAR_CHART_LEGEND_TEST_ID}
        >
          {series.map((serie) => (
            <div key={`realtime-usage-legend-${serie.key}`} className="flex items-center gap-2">
              <div className="size-2 rounded-full" style={{ backgroundColor: serie.color }} />
              <Typography variant="caption" color="grey700" noWrap>
                {serie.label}
              </Typography>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
