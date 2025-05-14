import { Icon, Typography } from 'lago-design-system'
import _groupBy from 'lodash/groupBy'
import { useMemo } from 'react'
import { generatePath, Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { formatUsageData } from '~/components/analytics/usage/utils'
import StackedBarChart from '~/components/designSystem/graphs/StackedBarChart'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { ANALYTIC_USAGE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, TimeGranularityEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

type UsageBreakdownBillableMetricsProps = {
  data: any //stefan
  defaultStaticDatePeriod: string
  defaultStaticTimeGranularity: TimeGranularityEnum
  selectedCurrency: CurrencyEnum
  filtersPrefix: string
  loading: boolean
}

const UsageBreakdownBillableMetrics = ({
  data,
  defaultStaticDatePeriod,
  defaultStaticTimeGranularity,
  selectedCurrency,
  filtersPrefix,
  loading,
}: UsageBreakdownBillableMetricsProps) => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()

  const { grouped, totals } = useMemo(() => {
    if (!data) {
      return {
        grouped: {},
        totals: {},
      }
    }

    const groups = _groupBy(data, (item) => item.billableMetricCode)
    const _totals = {}

    Object.keys(groups).map((key) => {
      const formatted = formatUsageData({
        searchParams,
        data: groups[key],
        defaultStaticDatePeriod,
        defaultStaticTimeGranularity,
        filtersPrefix,
      })

      groups[key] = formatted

      _totals[key] = formatted.reduce((p, c) => p + Number(c.amountCents), 0) || 0

      return groups
    })

    return {
      grouped: groups,
      totals: _totals,
    }
  }, [data, defaultStaticDatePeriod, defaultStaticTimeGranularity, filtersPrefix, searchParams])

  return (
    <div className="mt-6 grid grid-cols-2 gap-6">
      {Object.keys(grouped || {}).map((key) => (
        <div className="flex flex-col gap-6" key={`usage-breakdown-billable-metric-${key}`}>
          <div className="flex flex-col gap-1">
            <Link
              to={generatePath(ANALYTIC_USAGE_BILLABLE_METRIC_ROUTE, {
                billableMetricCode: key,
              })}
            >
              <div className="flex cursor-pointer items-center gap-1">
                <Typography className="font-medium text-grey-700">{key}</Typography>

                <Icon name="chevron-right" size="small" />
              </div>
            </Link>

            <Typography className="text-sm text-grey-700">
              {intlFormatNumber(deserializeAmount(totals[key], selectedCurrency), {
                currency: selectedCurrency,
              })}
            </Typography>
          </div>

          <AnalyticsStateProvider>
            <StackedBarChart
              margin={{
                right: 32,
              }}
              xAxisDataKey="startOfPeriodDt"
              xAxisTickAttributes={['startOfPeriodDt', 'endOfPeriodDt']}
              currency={selectedCurrency}
              data={grouped[key]}
              loading={loading}
              timeGranularity={defaultStaticTimeGranularity}
              bars={[
                {
                  tooltipIndex: 0,
                  barIndex: 0,
                  dataKey: 'amountCents',
                  colorHex: theme.palette.primary[500],
                  tooltipLabel: translate('Amount'),
                },
              ]}
            />
          </AnalyticsStateProvider>
        </div>
      ))}
    </div>
  )
}

export default UsageBreakdownBillableMetrics
