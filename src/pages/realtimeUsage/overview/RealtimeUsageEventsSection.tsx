import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { bigNumberShortenNotation, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { TimezoneEnum, useGetRealtimeUsageEventsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RealtimeUsageQueryFilters } from '~/pages/realtimeUsage/common/types'
import { formatPeriod, isPartialPeriod } from '~/pages/realtimeUsage/common/utils'
import { theme } from '~/styles'

gql`
  query getRealtimeUsageEvents(
    $externalCustomerId: String
    $externalSubscriptionId: String
    $fromDatetime: ISO8601DateTime
    $toDatetime: ISO8601DateTime
  ) {
    realtimeUsageEvents(
      externalCustomerId: $externalCustomerId
      externalSubscriptionId: $externalSubscriptionId
      fromDatetime: $fromDatetime
      toDatetime: $toDatetime
    ) {
      eventsCount
      timeGranularity
      timezone
      points {
        time
        eventsCount
      }
    }
  }
`

export const REALTIME_USAGE_EVENTS_SECTION_TEST_ID = 'realtime-usage-events-section'
export const REALTIME_USAGE_EVENTS_TOTAL_TEST_ID = 'realtime-usage-events-total'

const CHART_HEIGHT = 200

type RealtimeUsageEventsSectionProps = {
  filters: RealtimeUsageQueryFilters
  pollInterval: number
}

export const RealtimeUsageEventsSection = ({
  filters,
  pollInterval,
}: RealtimeUsageEventsSectionProps): JSX.Element => {
  const { translate } = useInternationalization()

  const { data, loading } = useGetRealtimeUsageEventsQuery({
    variables: filters,
    pollInterval,
    notifyOnNetworkStatusChange: false,
  })

  const events = data?.realtimeUsageEvents
  const timezone = events?.timezone || TimezoneEnum.TzUtc

  const points = useMemo(() => {
    if (!events) return []

    const now = DateTime.now()

    return events.points.map((point) => ({
      time: point.time,
      // BigInt fields come back as strings.
      eventsCount: Number(point.eventsCount),
      isPartial: isPartialPeriod(point.time, events.timeGranularity, now),
    }))
  }, [events])

  const eventsCount = Number(events?.eventsCount || 0)
  const format = (time: string): string =>
    events ? formatPeriod(time, events.timeGranularity, timezone) : time

  const renderChart = (): JSX.Element => {
    if (loading && !events) {
      return (
        <div className="flex flex-col justify-end gap-3" style={{ height: CHART_HEIGHT }}>
          <Skeleton variant="text" className="w-40" />
          <Skeleton variant="text" className="w-full" />
        </div>
      )
    }

    const firstTime = points[0]?.time
    const lastTime = points[points.length - 1]?.time

    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart data={points} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="realtimeUsageEventsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.palette.primary[200]} stopOpacity={0.4} />
              <stop offset="100%" stopColor={theme.palette.primary[200]} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            cursor={{ stroke: theme.palette.grey[300] }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload

              if (!active || !point) return null

              return (
                <div className="flex flex-col gap-1 rounded-xl bg-grey-700 px-4 py-3">
                  <Typography variant="captionHl" color="white">
                    {format(point.time)}
                  </Typography>
                  <Typography variant="caption" color="white">
                    {translate(
                      'text_1739181747394eventscount',
                      { count: intlFormatNumber(point.eventsCount, { style: 'decimal' }) },
                      point.eventsCount,
                    )}
                  </Typography>
                </div>
              )
            }}
          />
          <Area
            type="linear"
            dataKey="eventsCount"
            stroke={theme.palette.primary[600]}
            strokeWidth={2}
            fill="url(#realtimeUsageEventsGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <section
      className="flex flex-col gap-4 pb-8 shadow-b"
      data-test={REALTIME_USAGE_EVENTS_SECTION_TEST_ID}
    >
      <div className="flex flex-col gap-2">
        <Typography variant="subhead1" color="grey700">
          {translate('text_1792500580726g0dhn1qrvbs')}
        </Typography>
        {loading && !events ? (
          <Skeleton variant="text" className="w-32" />
        ) : (
          <Typography
            variant="headline"
            color="grey700"
            data-test={REALTIME_USAGE_EVENTS_TOTAL_TEST_ID}
          >
            {translate(
              'text_1739181747394eventscount',
              { count: intlFormatNumber(eventsCount, { style: 'decimal' }) },
              eventsCount,
            )}
          </Typography>
        )}
      </div>

      {renderChart()}
    </section>
  )
}
