import { gql } from '@apollo/client'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import AreaChart from '~/components/designSystem/graphs/AreaChart'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { useReportFetching } from '~/components/realtimeUsage/RealtimeUsageFetchingContext'
import { useHeldData } from '~/components/realtimeUsage/useHeldData'
import { bigNumberShortenNotation, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { useGetRealtimeUsageEventsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RealtimeUsageError } from '~/pages/realtimeUsage/common/RealtimeUsageError'
import { RealtimeUsageQueryFilters } from '~/pages/realtimeUsage/common/types'
import { formatPeriod, heldKeyOf } from '~/pages/realtimeUsage/common/utils'

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
  skip: boolean
}

export const RealtimeUsageEventsSection = ({
  filters,
  skip,
}: RealtimeUsageEventsSectionProps): JSX.Element => {
  const { translate } = useInternationalization()

  const {
    data: servedData,
    loading,
    error,
  } = useGetRealtimeUsageEventsQuery({
    variables: filters,
    skip,
    fetchPolicy: 'no-cache',
    context: { silentError: true },
  })
  const { data } = useHeldData(servedData, heldKeyOf(filters), !!error)

  useReportFetching(loading)

  const events = data?.realtimeUsageEvents
  const isLoading = loading && !events

  const formatEvents = (count: number): string =>
    translate(
      'text_1739181747394eventscount',
      { count: intlFormatNumber(count, { style: 'decimal' }) },
      count,
    )

  const chartData = events
    ? events.points.map((point) => {
        const period = formatPeriod(point.time, events.timeGranularity, events.timezone)
        // BigInt fields come back as strings.
        const eventsCount = Number(point.eventsCount)

        return {
          axisName: period,
          value: eventsCount,
          tooltipLabel: `${period}: ${formatEvents(eventsCount)}`,
        }
      })
    : []

  const renderContent = (): JSX.Element => {
    if (error && !events) return <RealtimeUsageError />

    return (
      <AnalyticsStateProvider>
        <AreaChart
          blur={false}
          loading={isLoading}
          data={chartData}
          height={CHART_HEIGHT}
          hasOnlyZeroValues={chartData.every((point) => point.value === 0)}
          valueFormatter={bigNumberShortenNotation}
        />
      </AnalyticsStateProvider>
    )
  }

  return (
    <section className="flex flex-col gap-6" data-test={REALTIME_USAGE_EVENTS_SECTION_TEST_ID}>
      <div className="flex flex-col gap-6">
        <Typography variant="subhead1" color="grey700">
          {translate('text_1792500580726g0dhn1qrvbs')}
        </Typography>
        {isLoading && <Skeleton variant="text" className="w-32" />}
        {!isLoading && !!events && (
          <Typography
            variant="headline"
            color="grey700"
            data-test={REALTIME_USAGE_EVENTS_TOTAL_TEST_ID}
          >
            {formatEvents(Number(events.eventsCount))}
          </Typography>
        )}
      </div>

      {renderContent()}
    </section>
  )
}
