import { useEffect, useMemo, useState } from 'react'
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
import { WINDOWS } from '~/components/subscriptions/realtimeUsage/common/constants'
import { RealtimeUsageControls } from '~/components/subscriptions/realtimeUsage/common/RealtimeUsageControls'
import { RealtimeUsageEmpty } from '~/components/subscriptions/realtimeUsage/common/RealtimeUsageEmpty'
import { RealtimeUsageHeader } from '~/components/subscriptions/realtimeUsage/common/RealtimeUsageHeader'
import { useRealtimeUsage } from '~/components/subscriptions/realtimeUsage/common/useRealtimeUsage'
import {
  formatUnits,
  prefersReducedMotion,
} from '~/components/subscriptions/realtimeUsage/common/utils'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { tw } from '~/styles/utils'

import {
  REALTIME_USAGE_CHART_TEST_ID,
  REALTIME_USAGE_EMPTY_TEST_ID,
  REALTIME_USAGE_LEGEND_TEST_ID,
  REALTIME_USAGE_LIVE_TEST_ID,
  REALTIME_USAGE_TEST_ID_PREFIX,
  SCALE_ANIMATION_DURATION,
} from './constants'
import { StackedSegment } from './StackedSegment'
import { UsageTooltip } from './UsageTooltip'
import { useCurrentHourTween } from './useCurrentHourTween'
import { buildSeriesAndPoints, findPoint } from './utils'

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
  const [settledScaleKey, setSettledScaleKey] = useState<string>('')
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
      return <RealtimeUsageEmpty testId={REALTIME_USAGE_EMPTY_TEST_ID} hasError={state.hasError} />
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
                  point={findPoint(points, payload?.[0]?.payload)}
                  series={series}
                  unitLabel={unitLabel}
                  formatHour={formatHour}
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
        <RealtimeUsageControls state={state} testIdPrefix={REALTIME_USAGE_TEST_ID_PREFIX} />

        {renderContent()}
      </div>
    </section>
  )
}
