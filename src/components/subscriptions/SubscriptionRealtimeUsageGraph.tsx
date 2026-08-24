import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
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
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { intlFormatDateTime, TimeFormat } from '~/core/timezone'
import {
  AggregationTypeEnum,
  TimezoneEnum,
  useGetSubscriptionChargesForRealtimeUsageQuery,
  useGetSubscriptionHourlyUsageQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { tw } from '~/styles/utils'

gql`
  query getSubscriptionChargesForRealtimeUsage($subscriptionId: ID!) {
    subscription(id: $subscriptionId) {
      id
      customer {
        id
        applicableTimezone
      }
      plan {
        id
        charges {
          id
          invoiceDisplayName
          billableMetric {
            id
            code
            name
            aggregationType
          }
        }
      }
    }
  }

  query getSubscriptionHourlyUsage(
    $subscriptionId: ID!
    $chargeId: ID!
    $fromDatetime: ISO8601DateTime
  ) {
    subscriptionHourlyUsage(
      subscriptionId: $subscriptionId
      chargeId: $chargeId
      fromDatetime: $fromDatetime
    ) {
      fromDatetime
      toDatetime
      timezone
      aggregationType
      filters {
        chargeFilterId
        invoiceDisplayName
        units
        eventsCount
      }
      hours {
        time
        units
        eventsCount
        breakdown {
          chargeFilterId
          units
        }
      }
    }
  }
`

export const REALTIME_USAGE_LIVE_TEST_ID = 'realtime-usage-live'
export const REALTIME_USAGE_EMPTY_TEST_ID = 'realtime-usage-empty'
export const REALTIME_USAGE_LEGEND_TEST_ID = 'realtime-usage-legend'
export const REALTIME_USAGE_TABLE_TEST_ID = 'realtime-usage-table'
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
// Auto-refresh is off by default: polling is opt-in, so an idle usage tab
// stays idle.
const AUTO_REFRESH_OPTIONS = [0, 1, 5, 10]
const CURRENT_HOUR_TWEEN_DURATION = 250
const WINDOW_REFRESH_INTERVAL = 60000
const WINDOWS = [6, 12, 24]
const REALTIME_AGGREGATION_TYPES = [AggregationTypeEnum.CountAgg, AggregationTypeEnum.SumAgg]

type Series = { key: string; label: string; color: string }
type HourPoint = { time: string; isPartial: boolean } & Record<string, number | string | boolean>

const startOfHourMinusHours = (hours: number): string => {
  const date = new Date()

  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() - (hours - 1))

  return date.toISOString()
}

export const SubscriptionRealtimeUsageGraph = ({
  subscriptionId,
}: {
  subscriptionId: string
}): JSX.Element | null => {
  const { translate } = useInternationalization()
  const [chargeId, setChargeId] = useState<string>('')
  const [windowInHours, setWindowInHours] = useState<number>(24)
  const [autoRefreshSeconds, setAutoRefreshSeconds] = useState<number>(0)
  const [fromDatetime, setFromDatetime] = useState<string>(() =>
    startOfHourMinusHours(windowInHours),
  )

  // The window start only moves when the selection changes or the hour turns;
  // recomputing it on every poll would refetch on every tick.
  useEffect(() => {
    const refresh = (): void => setFromDatetime(startOfHourMinusHours(windowInHours))

    refresh()

    const interval = setInterval(refresh, WINDOW_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [windowInHours])

  const { data: subscriptionData, loading: subscriptionLoading } =
    useGetSubscriptionChargesForRealtimeUsageQuery({
      variables: { subscriptionId },
      skip: !subscriptionId,
    })

  const charges = useMemo(
    () =>
      (subscriptionData?.subscription?.plan?.charges || []).filter((charge) =>
        REALTIME_AGGREGATION_TYPES.includes(charge.billableMetric.aggregationType),
      ),
    [subscriptionData],
  )

  const selectedCharge = charges.find((charge) => charge.id === chargeId) || charges[0]
  const timezone = (subscriptionData?.subscription?.customer?.applicableTimezone ||
    TimezoneEnum.TzUtc) as TimezoneEnum

  const changeWindow = (value: number): void => {
    if (value === windowInHours) return

    setWindowInHours(value)
  }

  const { data, loading, previousData } = useGetSubscriptionHourlyUsageQuery({
    variables: {
      subscriptionId,
      chargeId: selectedCharge?.id || '',
      fromDatetime,
    },
    skip: !selectedCharge,
    pollInterval: autoRefreshSeconds * 1000,
  })

  // Hold the previous render while a poll is in flight: no skeleton flash and
  // no layout jump every five seconds.
  const usage = data?.subscriptionHourlyUsage || previousData?.subscriptionHourlyUsage
  const isLoading = (subscriptionLoading || loading) && !usage

  const unitLabel = translate(
    usage?.aggregationType === AggregationTypeEnum.CountAgg
      ? 'text_1787607502687bbm16iot9di'
      : 'text_1787607502687zc1gdrqwnzj',
  )

  const { series, points } = useMemo(
    () => buildSeriesAndPoints(usage?.filters, usage?.hours, translate),
    [usage, translate],
  )

  const displayPoints = useCurrentHourTween(points)

  const { currentHour, peak, peakTime } = useMemo(() => {
    const totals = (usage?.hours || []).map((hour) => hour.units)
    const peakIndex = totals.indexOf(Math.max(...totals, 0))

    return {
      currentHour: totals[totals.length - 1] || 0,
      peak: totals[peakIndex] || 0,
      peakTime: usage?.hours[peakIndex]?.time,
    }
  }, [usage])

  const formatHour = (time: string): string =>
    intlFormatDateTime(time, { timezone, formatTime: TimeFormat.TIME_24_SIMPLE }).time

  const hasUsage = (usage?.filters.length || 0) > 0
  // The served window still lags the requested one while the new scale loads.
  const isSwitchingScale =
    !!usage && new Date(usage.fromDatetime).getTime() !== new Date(fromDatetime).getTime()
  const renderContent = (): JSX.Element => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" className="w-40" />
          <Skeleton variant="text" className="w-full" />
        </div>
      )
    }

    if (!hasUsage) {
      return (
        <div
          className="flex flex-col gap-1 py-8 text-center"
          data-test={REALTIME_USAGE_EMPTY_TEST_ID}
        >
          <Typography variant="subhead2" color="grey700">
            {translate('text_1787607502687zw3kwy13xlm')}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_17876075026878y6buigdffk')}
          </Typography>
        </div>
      )
    }

    return (
      <div
        data-test={REALTIME_USAGE_CHART_TEST_ID}
        className={tw(
          'flex flex-col gap-4 transition-all duration-200 ease-out motion-reduce:transition-none',
          isSwitchingScale && 'translate-y-1 opacity-40',
        )}
      >
        <div className="flex flex-row flex-wrap gap-8">
          <KeyFigure
            label={translate('text_1787607502687kk9iifzv84b')}
            value={`${formatUnits(currentHour)} ${unitLabel}`}
          />
          <KeyFigure
            label={translate('text_17876075026874f3ren735vy')}
            value={formatUnits(peak)}
            caption={peakTime ? formatHour(peakTime) : undefined}
          />
          <KeyFigure
            label={translate('text_1787607502687yrooy5zddk1')}
            value={String(usage?.filters.length || 0)}
          />
        </div>

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
                maxBarSize={24}
                isAnimationActive={false}
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
          <Typography variant="captionHl" color="grey500" noWrap>
            {translate('text_1787607502687kk9iifzv84b')}
          </Typography>
          {series.map((serie) => (
            <div key={`realtime-usage-legend-${serie.key}`} className="flex items-center gap-2">
              <div className="size-3 rounded-sm" style={{ backgroundColor: serie.color }} />
              <Typography variant="caption" color="grey700" noWrap>
                {serie.label}
              </Typography>
              <Typography variant="caption" color="grey600" noWrap>
                {formatUnits(seriesValue(points[points.length - 1], serie.key))}
              </Typography>
            </div>
          ))}
        </div>

        <UsageTable series={series} points={points} formatHour={formatHour} translate={translate} />
      </div>
    )
  }

  if (!subscriptionLoading && charges.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex h-10 flex-row items-start shadow-b">
        <div className="flex flex-row items-center gap-2">
          <Typography variant="subhead1" color="grey700" noWrap>
            {translate('text_1787607502687njc8sk8pgf4')}
          </Typography>
          <Tooltip placement="top-start" title={translate('text_1787607502687amwxqtlozbw')}>
            <Icon name="info-circle" />
          </Tooltip>
          {!isLoading && autoRefreshSeconds > 0 && (
            <span
              className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5"
              data-test={REALTIME_USAGE_LIVE_TEST_ID}
            >
              <span className="size-1.5 animate-pulse rounded-full bg-green-600 motion-reduce:animate-none" />
              <Typography variant="captionHl" color="success600">
                {translate('text_1787607502687jr0jliz0c3k')}
              </Typography>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white py-6">
        <div className="flex flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex flex-row flex-wrap items-center gap-2">
            {charges.length > 1 &&
              charges.map((charge) => (
                <button
                  key={`realtime-usage-charge-${charge.id}`}
                  type="button"
                  data-test={`${REALTIME_USAGE_CHARGE_TAB_TEST_ID}-${charge.billableMetric.code}`}
                  onClick={() => setChargeId(charge.id)}
                  className={tw(
                    'rounded-lg border border-grey-300 px-3 py-1 text-sm text-grey-600 hover:bg-grey-100',
                    charge.id === selectedCharge?.id && 'border-blue-600 bg-blue-100 text-blue-600',
                  )}
                >
                  {charge.invoiceDisplayName || charge.billableMetric.name}
                </button>
              ))}
          </div>

          <div className="ml-auto flex flex-row flex-wrap items-center gap-x-5 gap-y-2">
            <SegmentedControl
              dataTest={REALTIME_USAGE_TIME_RANGE_TEST_ID}
              label={translate('text_1787610177631jhuc7lxfw1v')}
              value={windowInHours}
              onChange={changeWindow}
              options={WINDOWS.map((value) => ({ value, label: `${value}h` }))}
            />

            <SegmentedControl
              dataTest={REALTIME_USAGE_AUTO_REFRESH_TEST_ID}
              label={translate('text_17876098439600jp8nt3z0hk')}
              value={autoRefreshSeconds}
              onChange={setAutoRefreshSeconds}
              options={AUTO_REFRESH_OPTIONS.map((value) => ({
                value,
                label: value === 0 ? translate('text_1787609843960bopfeje8bho') : `${value}s`,
              }))}
            />
          </div>
        </div>

        {renderContent()}
      </div>
    </section>
  )
}

const formatUnits = (value: number): string =>
  intlFormatNumber(value, { style: 'decimal', maximumFractionDigits: 2 })

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

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

const SegmentedControl = ({
  label,
  options,
  value,
  onChange,
  dataTest,
}: {
  label: string
  options: { value: number; label: string }[]
  value: number
  onChange: (value: number) => void
  dataTest: string
}): JSX.Element => (
  <div className="flex flex-row items-center gap-2" data-test={dataTest}>
    <Typography variant="captionHl" color="grey500" noWrap>
      {label}
    </Typography>
    <div className="flex flex-row items-center overflow-hidden rounded-lg border border-grey-300">
      {options.map((option) => (
        <button
          key={`${dataTest}-${option.value}`}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={tw(
            'border-r border-grey-300 px-2 py-1 text-sm text-grey-600 last:border-r-0 hover:bg-grey-100',
            option.value === value && 'bg-blue-100 font-medium text-blue-600',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
)

const KeyFigure = ({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption?: string
}): JSX.Element => (
  <div className="flex flex-col">
    <Typography variant="captionHl" color="grey500" noWrap>
      {label}
    </Typography>
    <div className="flex items-baseline gap-1">
      <Typography variant="subhead1" color="grey700" noWrap>
        {value}
      </Typography>
      {!!caption && (
        <Typography variant="caption" color="grey600" noWrap>
          {caption}
        </Typography>
      )}
    </div>
  </div>
)

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

const UsageTable = ({
  series,
  points,
  formatHour,
  translate,
}: {
  series: Series[]
  points: HourPoint[]
  formatHour: (time: string) => string
  translate: TranslateFunc
}): JSX.Element => (
  <details className="border-t border-grey-200 pt-3">
    <summary className="cursor-pointer">
      <Typography className="inline" variant="caption" color="grey600">
        {translate('text_17876075026879ho9f5zsobi')}
      </Typography>
    </summary>
    <div className="mt-3 max-h-60 overflow-auto">
      <table
        className="w-full text-right text-sm tabular-nums"
        data-test={REALTIME_USAGE_TABLE_TEST_ID}
      >
        <thead>
          <tr>
            <th className="py-1 pr-4 text-left font-medium text-grey-600">
              {translate('text_1787607502687j2okdne0is9')}
            </th>
            {series.map((serie) => (
              <th
                key={`realtime-usage-th-${serie.key}`}
                className="py-1 pl-4 font-medium text-grey-600"
              >
                {serie.label}
              </th>
            ))}
            <th className="py-1 pl-4 font-medium text-grey-600">
              {translate('text_1787607502687fbugu4gz6xl')}
            </th>
          </tr>
        </thead>
        <tbody>
          {[...points].reverse().map((point) => (
            <tr key={`realtime-usage-tr-${point.time}`} className="border-t border-grey-200">
              <td className="py-1 pr-4 text-left text-grey-600">{formatHour(point.time)}</td>
              {series.map((serie) => (
                <td key={`realtime-usage-td-${point.time}-${serie.key}`} className="py-1 pl-4">
                  {formatUnits(seriesValue(point, serie.key))}
                </td>
              ))}
              <td className="py-1 pl-4 font-medium">{formatUnits(totalOf(point, series))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
)

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
