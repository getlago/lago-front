import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useMemo } from 'react'

import StackedBarChart from '~/components/designSystem/graphs/StackedBarChart'
import { Typography } from '~/components/designSystem/Typography'
import { PeriodPoint } from '~/components/realtimeUsage/types'
import { formatUnits } from '~/components/realtimeUsage/utils'
import {
  CurrencyEnum,
  RealtimeUsageBarChartReportFragment,
  TimezoneEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import {
  REALTIME_USAGE_BAR_CHART_LEGEND_TEST_ID,
  REALTIME_USAGE_BAR_CHART_TEST_ID,
} from './constants'
import { buildDimensionSeries, formatPeriod } from './utils'

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

type RealtimeUsageBarChartProps = {
  report?: RealtimeUsageBarChartReportFragment
  loading: boolean
  now: DateTime
  height?: number
}

export const RealtimeUsageBarChart = ({
  report,
  loading,
  now,
  height,
}: RealtimeUsageBarChartProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()

  const { series, points } = useMemo(
    () => buildDimensionSeries(report, translate, now),
    [report, translate, now],
  )

  const timezone = report?.timezone || TimezoneEnum.TzUtc
  const granularity = report?.timeGranularity

  return (
    <div className="flex flex-col gap-4" data-test={REALTIME_USAGE_BAR_CHART_TEST_ID}>
      <StackedBarChart<PeriodPoint>
        // The units formatter ignores it; the chart only needs one to lay out its axis.
        currency={organization?.defaultCurrency || CurrencyEnum.Usd}
        customFormatter={(value) => formatUnits(Number(value))}
        periodFormatter={(time) => (granularity ? formatPeriod(time, granularity, timezone) : time)}
        data={points}
        loading={loading}
        height={height}
        xAxisDataKey="time"
        xAxisTickAttributes={['time', 'time']}
        fadedDataKey="isPartial"
        fadeOnHover
        tooltipFormatter={(units) =>
          `${formatUnits(units)} ${translate('text_17476657511358tgyvof5x1u', undefined, units)}`
        }
        tooltipTotalLabel={
          series.length > 1 ? translate('text_1787607502687fbugu4gz6xl') : undefined
        }
        bars={series.map((serie, index) => ({
          dataKey: serie.key,
          tooltipLabel: serie.label,
          colorHex: serie.color,
          barIndex: index,
          tooltipIndex: index,
        }))}
      />

      {series.length > 1 && (
        <div
          className="flex flex-row flex-wrap items-center gap-x-3 gap-y-1"
          data-test={REALTIME_USAGE_BAR_CHART_LEGEND_TEST_ID}
        >
          {series.map((serie) => (
            <div key={`realtime-usage-legend-${serie.key}`} className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: serie.color }} />
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
