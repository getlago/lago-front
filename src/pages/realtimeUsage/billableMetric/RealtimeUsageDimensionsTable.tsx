import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { PaginatedContent, usePageSearchParam } from '~/components/designSystem/Pagination'
import { HorizontalDataTable } from '~/components/designSystem/Table/HorizontalDataTable'
import { Typography } from '~/components/designSystem/Typography'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  GetRealtimeUsageDimensionsQueryVariables,
  RealtimeUsageTimeGranularityEnum,
  TimezoneEnum,
  useGetRealtimeUsageDimensionsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  DEFAULT_DIMENSION_COLOR,
  OTHER_DIMENSION_COLOR,
} from '~/pages/realtimeUsage/common/constants'
import { Series } from '~/pages/realtimeUsage/common/types'
import { formatPeriod } from '~/pages/realtimeUsage/common/utils'

gql`
  query getRealtimeUsageDimensions(
    $billableMetricCode: String!
    $dimensionKeys: [String!]
    $page: Int
    $limit: Int
    $externalCustomerId: String
    $externalSubscriptionId: String
    $fromDatetime: ISO8601DateTime
    $toDatetime: ISO8601DateTime
  ) {
    realtimeUsageDimensions(
      billableMetricCode: $billableMetricCode
      dimensionKeys: $dimensionKeys
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
        key
        name
        points {
          time
          units
        }
      }
    }
  }
`

export const REALTIME_USAGE_DIMENSIONS_TABLE_TEST_ID = 'realtime-usage-dimensions-table'

const ROW_KEY_PREFIX = 'row_'

type PeriodColumn = { time: string } & Record<string, number | string>

type RealtimeUsageDimensionsTableProps = {
  queryVariables: Omit<GetRealtimeUsageDimensionsQueryVariables, 'page' | 'limit'>
  pollInterval: number
  // The chart's series, so a dimension keeps its color in the table.
  series: Series[]
  timeGranularity?: RealtimeUsageTimeGranularityEnum
  timezone?: TimezoneEnum
}

const UnitsCell = ({ units }: { units: number }): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <Typography variant="body" color={units > 0 ? 'grey700' : 'grey500'}>
      {`${intlFormatNumber(units, { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${translate(
        'text_17476657511358tgyvof5x1u',
        undefined,
        units,
      )}`}
    </Typography>
  )
}

export const RealtimeUsageDimensionsTable = ({
  queryVariables,
  pollInterval,
  series,
  timeGranularity = RealtimeUsageTimeGranularityEnum.Hour,
  timezone = TimezoneEnum.TzUtc,
}: RealtimeUsageDimensionsTableProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { page, goToPage } = usePageSearchParam()

  const { data, loading } = useGetRealtimeUsageDimensionsQuery({
    variables: { ...queryVariables, page, limit: DEFAULT_PAGE_SIZE },
    pollInterval,
    notifyOnNetworkStatusChange: true,
  })

  const dimensions = data?.realtimeUsageDimensions.collection
  const colorByKey = useMemo(
    () => new Map(series.map((serie) => [serie.dimensionKey, serie.color])),
    [series],
  )

  // The table reads one column per period, so the rows of the API are turned on their side.
  const columns = useMemo<PeriodColumn[]>(() => {
    if (!dimensions?.length) return []

    return dimensions[0].points.map((point, periodIndex) => {
      const column: PeriodColumn = { time: point.time }

      dimensions.forEach((dimension, rowIndex) => {
        column[`${ROW_KEY_PREFIX}${rowIndex}`] = dimension.points[periodIndex]?.units || 0
      })

      return column
    })
  }, [dimensions])

  return (
    <div data-test={REALTIME_USAGE_DIMENSIONS_TABLE_TEST_ID}>
      <PaginatedContent
        metadata={data?.realtimeUsageDimensions.metadata}
        loading={loading}
        onPageChange={goToPage}
        sticky={false}
      >
        <HorizontalDataTable
          leftColumnWidth={240}
          columnWidth={160}
          data={columns}
          loading={loading && !data}
          rows={[
            {
              key: 'time',
              type: 'header',
              label: translate('text_17925005807279qrubxiwlys'),
              content: (column) => (
                <Typography variant="captionHl" color="grey600">
                  {formatPeriod(String(column.time), timeGranularity, timezone)}
                </Typography>
              ),
            },
            ...(dimensions || []).map((dimension, rowIndex) => ({
              key: `${ROW_KEY_PREFIX}${rowIndex}`,
              type: 'data' as const,
              label: (
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        colorByKey.get(dimension.key) ||
                        (dimension.name ? OTHER_DIMENSION_COLOR : DEFAULT_DIMENSION_COLOR),
                    }}
                  />
                  <Typography variant="body" color="grey700" noWrap>
                    {dimension.name || translate('text_17876075026872bdz1e5aeep')}
                  </Typography>
                </div>
              ),
              content: (column: PeriodColumn) => (
                <UnitsCell units={Number(column[`${ROW_KEY_PREFIX}${rowIndex}`]) || 0} />
              ),
            })),
          ]}
        />
      </PaginatedContent>
    </div>
  )
}
