import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { generatePath, useSearchParams } from 'react-router'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { keyWithPrefix } from '~/components/Filters/graphql/utils'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { useHeldData } from '~/components/realtimeUsage/useHeldData'
import { formatUnits } from '~/components/realtimeUsage/utils'
import { REALTIME_USAGE_FILTER_PREFIX } from '~/core/constants/filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { Link, REALTIME_USAGE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  RealtimeUsageBarChartReportFragmentDoc,
  useGetRealtimeUsageBillableMetricsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RealtimeUsageBarChart } from '~/pages/realtimeUsage/common/RealtimeUsageBarChart'
import { RealtimeUsageError } from '~/pages/realtimeUsage/common/RealtimeUsageError'
import { RealtimeUsageQueryFilters } from '~/pages/realtimeUsage/common/types'
import { heldKeyOf } from '~/pages/realtimeUsage/common/utils'
import EmptyImage from '~/public/images/maneki/empty.svg'

gql`
  query getRealtimeUsageBillableMetrics(
    $page: Int
    $limit: Int
    $externalCustomerId: String
    $externalSubscriptionId: String
    $fromDatetime: ISO8601DateTime
    $toDatetime: ISO8601DateTime
  ) {
    realtimeUsageBillableMetrics(
      page: $page
      limit: $limit
      externalCustomerId: $externalCustomerId
      externalSubscriptionId: $externalSubscriptionId
      fromDatetime: $fromDatetime
      toDatetime: $toDatetime
    ) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        billableMetricId
        billableMetricCode
        billableMetricName
        units
        ...RealtimeUsageBarChartReport
      }
    }
  }

  ${RealtimeUsageBarChartReportFragmentDoc}
`

export const REALTIME_USAGE_BILLABLE_METRICS_SECTION_TEST_ID =
  'realtime-usage-billable-metrics-section'
export const REALTIME_USAGE_BILLABLE_METRICS_EMPTY_TEST_ID = 'realtime-usage-billable-metrics-empty'
export const REALTIME_USAGE_BILLABLE_METRIC_LINK_TEST_ID = 'realtime-usage-billable-metric-link'

type RealtimeUsageBillableMetricsSectionProps = {
  filters: RealtimeUsageQueryFilters
  now: DateTime
  skip: boolean
}

export const RealtimeUsageBillableMetricsSection = ({
  filters,
  now,
  skip,
}: RealtimeUsageBillableMetricsSectionProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()
  const { page, goToPage } = usePageSearchParam()

  const variables = { ...filters, page, limit: DEFAULT_PAGE_SIZE }
  const {
    data: servedData,
    loading,
    error,
  } = useGetRealtimeUsageBillableMetricsQuery({
    variables,
    skip,
    fetchPolicy: 'no-cache',
    context: { silentError: true },
  })
  const { data, isHeld } = useHeldData(servedData, heldKeyOf(variables), !!error)

  const reports = data?.realtimeUsageBillableMetrics.collection || []
  const metadata = data?.realtimeUsageBillableMetrics.metadata
  const isLoading = loading && !isHeld

  const detailSearch = (): string => {
    const params = new URLSearchParams(searchParams)

    params.delete(
      keyWithPrefix(AvailableFiltersEnum.realtimeDimensions, REALTIME_USAGE_FILTER_PREFIX),
    )
    params.delete('page')

    return params.toString()
  }

  const renderContent = (): JSX.Element => {
    if (error && !data) return <RealtimeUsageError />

    if (isLoading && !data) {
      return (
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <div
              key={`realtime-usage-billable-metric-skeleton-${index}`}
              className="flex flex-col gap-3"
            >
              <Skeleton variant="text" className="w-32" />
              <Skeleton variant="text" className="w-20" />
              <Skeleton variant="text" className="mt-24 w-full" />
            </div>
          ))}
        </div>
      )
    }

    if (!metadata?.totalCount) {
      return (
        <div data-test={REALTIME_USAGE_BILLABLE_METRICS_EMPTY_TEST_ID}>
          <GenericPlaceholder
            title={translate('text_1792500580727x6sctmgm8ms')}
            subtitle={translate('text_1792500580727ht5j5l54cxz')}
            image={<EmptyImage width="136" height="104" />}
          />
        </div>
      )
    }

    return (
      <PaginatedContent
        metadata={metadata}
        loading={isLoading}
        onPageChange={goToPage}
        sticky={false}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {reports.map((report) => (
            <div
              key={`realtime-usage-billable-metric-${report.billableMetricId}`}
              className="flex flex-col gap-6 py-6 shadow-b lg:odd:pr-6 lg:even:pl-6"
            >
              <div className="flex flex-col gap-1">
                <Link
                  data-test={REALTIME_USAGE_BILLABLE_METRIC_LINK_TEST_ID}
                  className="flex w-fit items-center gap-1 text-grey-700 visited:text-grey-700 hover:no-underline"
                  // The slug-aware Link only prefixes string targets.
                  to={`${generatePath(REALTIME_USAGE_BILLABLE_METRIC_ROUTE, {
                    billableMetricCode: report.billableMetricCode,
                  })}?${detailSearch()}`}
                >
                  <Typography variant="bodyHl" color="grey700">
                    {report.billableMetricName}
                  </Typography>
                  <Icon name="chevron-right-filled" color="dark" />
                </Link>
                <Typography variant="caption" color="grey600">
                  {`${formatUnits(report.units)} ${translate(
                    'text_17476657511358tgyvof5x1u',
                    undefined,
                    report.units,
                  )}`}
                </Typography>
              </div>

              <AnalyticsStateProvider>
                <RealtimeUsageBarChart report={report} loading={isLoading} now={now} />
              </AnalyticsStateProvider>
            </div>
          ))}
        </div>
      </PaginatedContent>
    )
  }

  return (
    <section
      className="flex flex-col gap-6"
      data-test={REALTIME_USAGE_BILLABLE_METRICS_SECTION_TEST_ID}
    >
      <Typography variant="subhead1" color="grey700">
        {translate('text_1792500580726ie6zfx1t4sd')}
      </Typography>

      {renderContent()}
    </section>
  )
}
