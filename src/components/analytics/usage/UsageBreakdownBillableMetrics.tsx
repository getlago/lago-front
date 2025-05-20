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
import { CurrencyEnum, DataApiUsage, TimeGranularityEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

type UsageBreakdownBillableMetricsProps = {
  data: DataApiUsage[]
  defaultStaticDatePeriod: string
  defaultStaticTimeGranularity: TimeGranularityEnum
  selectedCurrency: CurrencyEnum
  filtersPrefix: string
  loading: boolean
  valueKey: 'units' | 'amountCents'
  displayFormat?: (value: string | number, currency: CurrencyEnum) => string
}

const UsageBreakdownBillableMetrics = ({
  data,
  defaultStaticDatePeriod,
  defaultStaticTimeGranularity,
  selectedCurrency,
  filtersPrefix,
  loading,
  valueKey,
  displayFormat,
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
    const _totals: Record<string, number> = {}

    Object.keys(groups).forEach((key) => {
      const formatted = formatUsageData({
        searchParams,
        data: groups[key],
        defaultStaticDatePeriod,
        defaultStaticTimeGranularity,
        filtersPrefix,
      })

      groups[key] = formatted as DataApiUsage[]

      _totals[key] = formatted.reduce((p, c) => p + Number(c[valueKey]), 0) || 0

      return groups
    })

    return {
      grouped: groups,
      totals: _totals,
    }
  }, [
    data,
    defaultStaticDatePeriod,
    defaultStaticTimeGranularity,
    filtersPrefix,
    searchParams,
    valueKey,
  ])

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
              {displayFormat?.(totals[key], selectedCurrency) ||
                intlFormatNumber(deserializeAmount(totals[key], selectedCurrency), {
                  currency: selectedCurrency,
                })}
            </Typography>
          </div>

          <AnalyticsStateProvider>
            <StackedBarChart
              margin={{
                right: 32,
              }}
              customFormatter={displayFormat}
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
                  dataKey: valueKey as keyof DataApiUsage,
                  colorHex: theme.palette.primary[500],
                  tooltipLabel: translate('text_1746541426463wcwfuryd12g'),
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
