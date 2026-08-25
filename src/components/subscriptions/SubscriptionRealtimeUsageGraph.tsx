import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import {
  formatUnits,
  prefersReducedMotion,
  RealtimeUsageControls,
  RealtimeUsageEmpty,
  RealtimeUsageHeader,
  useRealtimeUsage,
  WINDOWS,
} from '~/components/subscriptions/realtimeUsage'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { tw } from '~/styles/utils'

export const REALTIME_USAGE_LIVE_TEST_ID = 'realtime-usage-live'
export const REALTIME_USAGE_EMPTY_TEST_ID = 'realtime-usage-empty'
export const REALTIME_USAGE_LEGEND_TEST_ID = 'realtime-usage-legend'
export const REALTIME_USAGE_CHARGE_TAB_TEST_ID = 'realtime-usage-charge-tab'
export const REALTIME_USAGE_AUTO_REFRESH_TEST_ID = 'realtime-usage-auto-refresh'
export const REALTIME_USAGE_TIME_RANGE_TEST_ID = 'realtime-usage-time-range'
export const REALTIME_USAGE_CHART_TEST_ID = 'realtime-usage-chart'

// Categorical series colors in a fixed order: the color follows the charge
// filter, never its rank, so hiding or reordering one never repaints the
// others. Validated for colorblind separation and contrast on white.
const FILTER_COLORS = ['#006CFA', '#F06700', '#5D48D5', '#008559', '#2FC1FE']
// The charge default (events matching no filter) and the folded tail are
// deliberately grey: they are the absence of a filter, not another one.
const DEFAULT_FILTER_COLOR = theme.palette.grey[500]
const OTHER_FILTER_COLOR = theme.palette.grey[400]

const MAX_VISIBLE_FILTERS = 5
const DEFAULT_KEY = 'default'
const OTHER_KEY = 'other'
const CURRENT_HOUR_TWEEN_DURATION = 250
const SCALE_ANIMATION_DURATION = 450

type Series = { key: string; label: string; color: string }
type HourPoint = { time: string; isPartial: boolean } & Record<string, number | string | boolean>

export const SubscriptionRealtimeUsageGraph = ({
  subscriptionId,
}: {
  subscriptionId: string
}): JSX.Element | null => {
  const { translate } = useInternationalization()
  const state = useRealtimeUsage(subscriptionId)
  const { usage, isLoading, unitLabel, formatHour, windowInHours } = state

  const barSize = (WINDOWS.find((option) => option.hours === windowInHours) || WINDOWS[0]).barSize

  const { series, points } = useMemo(
    () => buildSeriesAndPoints(usage?.filters, usage?.hours, translate),
    [usage, translate],
  )

  const displayPoints = useCurrentHourTween(points)

  // A scale change is a new view, not new data, so the columns rescale into
  // it: recharts interpolates every bar from where it was to where the new
  // window puts it, widening them on the way. The scale is the click plus
  // the window the API ends up serving, so both the immediate widening and
  // the arrival of the new hours are animated; polls leave it untouched and
  // so never replay it.
  const scaleKey = `${windowInHours}-${usage?.fromDatetime || ''}`
  const [settledScaleKey, setSettledScaleKey] = useState('')
  const isRescaling = settledScaleKey !== scaleKey && !prefersReducedMotion()

  useEffect(() => {
    const timer = setTimeout(() => setSettledScaleKey(scaleKey), SCALE_ANIMATION_DURATION)

    return () => clearTimeout(timer)
  }, [scaleKey])

  const renderContent = (): JSX.Element => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" className="w-40" />
          <Skeleton variant="text" className="w-full" />
        </div>
      )
    }

    if (!state.hasUsage) {
      return <RealtimeUsageEmpty testId={REALTIME_USAGE_EMPTY_TEST_ID} />
    }

    return (
      <div
        data-test={REALTIME_USAGE_CHART_TEST_ID}
        className={tw(
          'flex flex-col gap-4 transition-all duration-200 ease-out motion-reduce:transition-none',
          state.isSwitchingScale && 'translate-y-1 opacity-40',
        )}
      >
        <ResponsiveContainer width="100%" height={232}>
          <BarChart data={displayPoints} margin={{ top: 16, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={theme.palette.grey[200]} />
            <XAxis
              dataKey="time"
              axisLine={{ stroke: theme.palette.grey[300] }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{ fill: theme.palette.grey[600], fontSize: 12 }}
              tickFormatter={formatHour}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              tick={{ fill: theme.palette.grey[600], fontSize: 12 }}
              tickFormatter={formatUnits}
            />
            <RechartTooltip
              cursor={{ fill: theme.palette.grey[100] }}
              content={({ active, payload }) => (
                <UsageTooltip
                  active={!!active}
                  // The chart may be mid-tween on the current hour; the
                  // readout always shows the value that was actually served.
                  point={findPoint(points, payload?.[0]?.payload as HourPoint | undefined)}
                  series={series}
                  unitLabel={unitLabel}
                  formatHour={formatHour}
                  translate={translate}
                />
              )}
            />
            {series.map((serie) => (
              <Bar
                key={`realtime-usage-bar-${serie.key}`}
                dataKey={serie.key}
                stackId="usage"
                fill={serie.color}
                maxBarSize={barSize}
                isAnimationActive={isRescaling}
                animationDuration={SCALE_ANIMATION_DURATION}
                animationEasing="ease-out"
                shape={
                  <StackedSegment
                    seriesKey={serie.key}
                    seriesKeys={series.map((item) => item.key)}
                  />
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        <div
          className="flex flex-row flex-wrap items-center gap-x-6 gap-y-2"
          data-test={REALTIME_USAGE_LEGEND_TEST_ID}
        >
          {series.map((serie) => (
            <div key={`realtime-usage-legend-${serie.key}`} className="flex items-center gap-2">
              <div className="size-3 rounded-sm" style={{ backgroundColor: serie.color }} />
              <Typography variant="caption" color="grey700" noWrap>
                {serie.label}
              </Typography>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!state.hasRealtimeCharge) {
    return null
  }

  return (
    <section>
      <RealtimeUsageHeader
        title={translate('text_1787607502687njc8sk8pgf4')}
        tooltip={translate('text_1787607502687amwxqtlozbw')}
        isLive={!isLoading && state.autoRefreshSeconds > 0}
        liveTestId={REALTIME_USAGE_LIVE_TEST_ID}
      />

      <div className="flex flex-col gap-4 bg-white py-6">
        <RealtimeUsageControls state={state} testIdPrefix="realtime-usage" />

        {renderContent()}
      </div>
    </section>
  )
}

const seriesValue = (point: HourPoint | undefined, key: string): number =>
  (point?.[key] as number) || 0

const findPoint = (points: HourPoint[], point: HourPoint | undefined): HourPoint | undefined =>
  points.find((candidate) => candidate.time === point?.time) || point

const totalOf = (point: HourPoint, series: Series[]): number =>
  series.reduce((sum, serie) => sum + seriesValue(point, serie.key), 0)

// Top filters keep one color each; everything past the cap folds into a single
// grey "Other" series rather than growing the palette.
const buildSeriesAndPoints = (
  filters: { chargeFilterId?: string | null; invoiceDisplayName?: string | null }[] | undefined,
  hours:
    { time: string; breakdown: { chargeFilterId?: string | null; units: number }[] }[] | undefined,
  translate: TranslateFunc,
): { series: Series[]; points: HourPoint[] } => {
  if (!filters?.length || !hours?.length) {
    return { series: [], points: [] }
  }

  const visible = filters.slice(0, MAX_VISIBLE_FILTERS)
  const folded = filters.slice(MAX_VISIBLE_FILTERS)
  let colorIndex = 0

  const series: Series[] = visible.map((filter) => {
    const isDefault = !filter.chargeFilterId

    return {
      key: filter.chargeFilterId || DEFAULT_KEY,
      label: filter.invoiceDisplayName || translate('text_17876075026872bdz1e5aeep'),
      color: isDefault ? DEFAULT_FILTER_COLOR : FILTER_COLORS[colorIndex++ % FILTER_COLORS.length],
    }
  })

  if (folded.length > 0) {
    series.push({
      key: OTHER_KEY,
      label: translate('text_1787607502687pyo0kxh1flz'),
      color: OTHER_FILTER_COLOR,
    })
  }

  const foldedIds = new Set(folded.map((filter) => filter.chargeFilterId))
  const lastIndex = hours.length - 1

  const points: HourPoint[] = hours.map((hour, index) => {
    const point: HourPoint = { time: hour.time, isPartial: index === lastIndex }

    series.forEach((serie) => {
      point[serie.key] = 0
    })

    hour.breakdown.forEach((breakdown) => {
      const key = foldedIds.has(breakdown.chargeFilterId)
        ? OTHER_KEY
        : breakdown.chargeFilterId || DEFAULT_KEY

      point[key] = seriesValue(point, key) + breakdown.units
    })

    return point
  })

  return { series, points }
}

// Only the current hour can still move: every closed hour is a settled bucket
// sum. So the chart tweens that one column and leaves the rest alone —
// animating the whole chart on each poll would imply motion in data that is
// final. A new hour (or a shrinking value, meaning a corrected bucket) snaps.
const useCurrentHourTween = (points: HourPoint[]): HourPoint[] => {
  const [displayPoints, setDisplayPoints] = useState<HourPoint[]>(points)
  const frameRef = useRef<number>()
  const fromRef = useRef<HourPoint | undefined>(undefined)

  useEffect(() => {
    const target = points[points.length - 1]
    const from = fromRef.current

    const snap = (): void => {
      fromRef.current = target
      setDisplayPoints(points)
    }

    if (!target || !from || from.time !== target.time || prefersReducedMotion()) {
      snap()

      return
    }

    const numericKeys = Object.keys(target).filter((key) => typeof target[key] === 'number')
    const hasGrown = numericKeys.some((key) => seriesValue(target, key) > seriesValue(from, key))

    if (!hasGrown) {
      snap()

      return
    }

    const start = performance.now()

    const step = (timestamp: number): void => {
      const progress = Math.min(1, (timestamp - start) / CURRENT_HOUR_TWEEN_DURATION)
      const eased = 1 - Math.pow(1 - progress, 3)
      const tweened: HourPoint = { ...target }

      numericKeys.forEach((key) => {
        const origin = seriesValue(from, key)

        tweened[key] = origin + (seriesValue(target, key) - origin) * eased
      })

      setDisplayPoints([...points.slice(0, -1), tweened])

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)

        return
      }

      fromRef.current = target
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [points])

  return displayPoints
}

const UsageTooltip = ({
  active,
  point,
  series,
  unitLabel,
  formatHour,
  translate,
}: {
  active: boolean
  point?: HourPoint
  series: Series[]
  unitLabel: string
  formatHour: (time: string) => string
  translate: TranslateFunc
}): JSX.Element | null => {
  if (!active || !point) return null

  const suffix = point.isPartial ? ` · ${translate('text_17876075026871lkywkgyybv')}` : ''

  return (
    <div className="flex min-w-50 flex-col gap-2 rounded-xl bg-grey-700 p-4">
      <Typography variant="captionHl" color="white">
        {`${formatHour(point.time)}${suffix}`}
      </Typography>
      {series.map((serie) => (
        <div
          key={`realtime-usage-tooltip-${serie.key}`}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full" style={{ backgroundColor: serie.color }} />
            <Typography variant="caption" color="white" noWrap>
              {serie.label}
            </Typography>
          </div>
          <Typography variant="caption" color="white" noWrap>
            {formatUnits(seriesValue(point, serie.key))}
          </Typography>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 border-t border-grey-500 pt-2">
        <Typography variant="caption" color="white" noWrap>
          {translate('text_1787607502687fbugu4gz6xl')}
        </Typography>
        <Typography variant="captionHl" color="white" noWrap>
          {`${formatUnits(totalOf(point, series))} ${unitLabel}`}
        </Typography>
      </div>
    </div>
  )
}

// Draws one segment of a stacked column: a 2px gap in the surface color
// separates it from the segment below, and the topmost segment of the column
// carries the rounded cap. The current hour is still filling, so it is drawn
// lighter than the hours that are already closed.
const StackedSegment = (props: {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: HourPoint
  seriesKey?: string
  seriesKeys?: string[]
}): JSX.Element | null => {
  const { x = 0, y = 0, width = 0, height = 0, fill, payload, seriesKey, seriesKeys = [] } = props

  if (height <= 0 || !seriesKey) return null

  const topSeriesKey = [...seriesKeys].reverse().find((key) => seriesValue(payload, key) > 0)
  const isTop = topSeriesKey === seriesKey
  const radius = isTop ? Math.min(4, width / 2, height) : 0
  const gap = height > 3 ? 2 : 0

  return (
    <path
      d={`M${x},${y + height - gap}L${x},${y + radius}Q${x},${y} ${x + radius},${y}L${
        x + width - radius
      },${y}Q${x + width},${y} ${x + width},${y + radius}L${x + width},${y + height - gap}Z`}
      fill={fill}
      opacity={payload?.isPartial ? 0.5 : 1}
    />
  )
}
