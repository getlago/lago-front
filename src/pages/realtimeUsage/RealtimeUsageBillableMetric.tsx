import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { keyWithPrefix, RealtimeUsageBillableMetricAvailableFilters } from '~/components/Filters'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { REALTIME_USAGE_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { REALTIME_USAGE_ROUTE, useNavigate } from '~/core/router'
import {
  RealtimeUsageBarChartReportFragmentDoc,
  useGetRealtimeUsageBillableMetricQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RealtimeUsageDimensionsTable } from '~/pages/realtimeUsage/billableMetric/RealtimeUsageDimensionsTable'
import { REALTIME_USAGE_ERROR_TEST_ID } from '~/pages/realtimeUsage/common/constants'
import { RealtimeUsageBarChart } from '~/pages/realtimeUsage/common/RealtimeUsageBarChart'
import { RealtimeUsageFilters } from '~/pages/realtimeUsage/common/RealtimeUsageFilters'
import { RealtimeUsageGate } from '~/pages/realtimeUsage/common/RealtimeUsageGate'
import { useRealtimeUsageFilters } from '~/pages/realtimeUsage/common/useRealtimeUsageFilters'
import { buildSeriesAndPoints } from '~/pages/realtimeUsage/common/utils'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  query getRealtimeUsageBillableMetric(
    $billableMetricCode: String!
    $dimensionKeys: [String!]
    $externalCustomerId: String
    $externalSubscriptionId: String
    $fromDatetime: ISO8601DateTime
    $toDatetime: ISO8601DateTime
  ) {
    realtimeUsageBillableMetric(
      billableMetricCode: $billableMetricCode
      dimensionKeys: $dimensionKeys
      externalCustomerId: $externalCustomerId
      externalSubscriptionId: $externalSubscriptionId
      fromDatetime: $fromDatetime
      toDatetime: $toDatetime
    ) {
      billableMetricCode
      billableMetricName
      units
      ...RealtimeUsageBarChartReport
    }
  }

  ${RealtimeUsageBarChartReportFragmentDoc}
`

export const REALTIME_USAGE_BILLABLE_METRIC_TOTAL_TEST_ID = 'realtime-usage-billable-metric-total'
export const REALTIME_USAGE_BACK_BUTTON_TEST_ID = 'realtime-usage-back-button'

const RealtimeUsageBillableMetric = (): JSX.Element => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { billableMetricCode = '' } = useParams()
  const { filters, dimensionKeys, pollInterval } = useRealtimeUsageFilters()

  const queryVariables = { ...filters, billableMetricCode, dimensionKeys }

  const { data, loading, error } = useGetRealtimeUsageBillableMetricQuery({
    variables: queryVariables,
    pollInterval,
    skip: !billableMetricCode,
  })

  const report = data?.realtimeUsageBillableMetric
  const title = report?.billableMetricName || billableMetricCode

  const { series } = useMemo(() => buildSeriesAndPoints(report, translate), [report, translate])

  const goBack = (): void => {
    const params = new URLSearchParams(searchParams)

    params.delete(
      keyWithPrefix(AvailableFiltersEnum.realtimeDimensions, REALTIME_USAGE_FILTER_PREFIX),
    )
    params.delete('page')

    navigate({ pathname: REALTIME_USAGE_ROUTE, search: params.toString() })
  }

  const renderContent = (): JSX.Element => {
    if (error && !report) {
      return (
        <div data-test={REALTIME_USAGE_ERROR_TEST_ID}>
          <GenericPlaceholder
            title={translate('text_634812d6f16b31ce5cbf4126')}
            subtitle={translate('text_634812d6f16b31ce5cbf4128')}
            buttonTitle={translate('text_634812d6f16b31ce5cbf412a')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        </div>
      )
    }

    const units = report?.units || 0

    return (
      <div className="flex flex-col gap-6">
        {loading && !report ? (
          <Skeleton variant="text" className="w-32" />
        ) : (
          <Typography
            variant="headline"
            color="grey700"
            data-test={REALTIME_USAGE_BILLABLE_METRIC_TOTAL_TEST_ID}
          >
            {`${intlFormatNumber(units, { style: 'decimal', maximumFractionDigits: 2 })} ${translate(
              'text_17476657511358tgyvof5x1u',
              undefined,
              units,
            )}`}
          </Typography>
        )}

        <AnalyticsStateProvider>
          <div className="flex flex-col gap-8">
            <RealtimeUsageBarChart report={report} loading={loading} height={240} />

            <RealtimeUsageDimensionsTable
              queryVariables={queryVariables}
              pollInterval={pollInterval}
              series={series}
              timeGranularity={report?.timeGranularity}
              timezone={report?.timezone}
            />
          </div>
        </AnalyticsStateProvider>
      </div>
    )
  }

  return (
    <RealtimeUsageGate>
      <PageBannerHeaderWithBurgerMenu>
        <div className="flex items-center gap-2">
          <Button
            data-test={REALTIME_USAGE_BACK_BUTTON_TEST_ID}
            variant="quaternary"
            icon="arrow-left"
            onClick={goBack}
          />
          <Typography variant="bodyHl" color="grey700">
            {title}
          </Typography>
        </div>
      </PageBannerHeaderWithBurgerMenu>

      <FullscreenPage.Wrapper>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <Typography variant="subhead1" color="grey700">
              {title}
            </Typography>

            <RealtimeUsageFilters
              availableFilters={RealtimeUsageBillableMetricAvailableFilters}
              queryNames={['getRealtimeUsageBillableMetric', 'getRealtimeUsageDimensions']}
            />
          </div>

          {renderContent()}
        </div>
      </FullscreenPage.Wrapper>
    </RealtimeUsageGate>
  )
}

export default RealtimeUsageBillableMetric
