import { Button, tw } from 'lago-design-system'
import random from 'lodash/random'
import { useEffect, useRef } from 'react'
import { generatePath, useLocation, useNavigate, useParams } from 'react-router-dom'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { useUsageAnalyticsBillableMetric } from '~/components/analytics/usage/useUsageAnalyticsBillableMetric'
import { HorizontalDataTable, NavigationTab, Typography } from '~/components/designSystem'
import {
  AvailableQuickFilters,
  Filters,
  UsageBillableMetricAvailableFilters,
  UsageBreakdownMeteredAvailableFilters,
} from '~/components/designSystem/Filters'
import StackedBarChart from '~/components/designSystem/graphs/StackedBarChart'
import { getItemDateFormatedByTimeGranularity } from '~/components/designSystem/graphs/utils'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  ANALYTICS_USAGE_BILLABLE_METRIC_FILTER_PREFIX,
  ANALYTICS_USAGE_BREAKDOWN_METERED_FILTER_PREFIX,
} from '~/core/constants/filters'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { ANALYTIC_ROUTE, ANALYTIC_TABS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, TimeGranularityEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Mrr from '~/pages/analytics/Mrr'
import PrepaidCredits from '~/pages/analytics/PrepaidCredits'
import RevenueStreams from '~/pages/analytics/RevenueStreams'
import Usage from '~/pages/analytics/Usage'
import { theme } from '~/styles'
import { PageHeader } from '~/styles'

const RowLabel = ({ label, color }: { label: string; color: string }) => (
  <div className="flex items-center gap-2">
    <div className="size-3 rounded-full" style={{ backgroundColor: color }} />

    <Typography className="font-medium text-grey-700">{label}</Typography>
  </div>
)

const AmountCell = ({ value, currency }: { value: number; currency: CurrencyEnum }) => {
  return (
    <Typography
      variant="body"
      className={tw({
        'text-green-600': value > 0,
        'text-grey-500': Number(value) === 0,
        'text-red-600': value < 0,
      })}
    >
      {intlFormatNumber(deserializeAmount(value, currency), {
        currencyDisplay: 'symbol',
        currency,
      })}
    </Typography>
  )
}

const UsageBillableMetric = () => {
  const { translate } = useInternationalization()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const navigate = useNavigate()

  const { billableMetricCode } = useParams()

  const {
    selectedCurrency,
    defaultCurrency,
    hasError,
    isLoading,
    totalAmountCents,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    hasAccessToAnalyticsDashboardsFeature,
    timeGranularity,
    data: xData,
  } = useUsageAnalyticsBillableMetric()

  const FAKE_FILTERS = [
    { key: 'storageUS', values: ['eminem'], __typename: 'BillableMetricFilter' },
    { key: 'storageEU', values: ['eminem'], __typename: 'BillableMetricFilter' },
    { key: 'storageAsia', values: ['world'], __typename: 'BillableMetricFilter' },
    { key: 'storageAfrica', values: ['hello', 'test'], __typename: 'BillableMetricFilter' },
  ]

  const filters = FAKE_FILTERS

  const data =
    xData?.map((i) => {
      const x = { ...i }

      filters.forEach((f) => {
        x[`amount_${f.key}`] = random(0, 20000)
      })

      return x
    }) || []

  const colors = [
    'rgba(0, 80, 184, 1)',
    'rgba(19, 102, 208, 1)',
    'rgba(38, 125, 255, 1)',
    'rgba(57, 140, 255, 1)',
    'rgba(76, 154, 255, 1)',
    'rgba(102, 170, 255, 1)',
    'rgba(128, 186, 255, 1)',
    'rgba(153, 198, 255, 1)',
    'rgba(179, 212, 255, 1)',
    'rgba(191, 215, 250, 1)',
    'rgba(204, 219, 245, 1)',
    'rgba(210, 221, 240, 1)',
    'rgba(215, 222, 235, 1)',
    'rgba(217, 222, 231, 1)',
    'rgba(220, 224, 229, 1)',
  ]

  const getColor = (index: number) => colors[index] ?? colors[colors.length - 1]

  const bars = filters.map((filter, index) => ({
    dataKey: `amount_${filter.key}`,
    colorHex: getColor(index),
    tooltipLabel: filter.key,
  }))

  const rows = filters.map((filter, index) => ({
    key: filter.key,
    type: 'data',
    label: <RowLabel label={filter.key} color={getColor(index)} />,
    content: (item) => (
      <AmountCell value={item[`amount_${filter.key}`]} currency={selectedCurrency} />
    ),
  }))

  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <div className="flex items-center gap-2">
          <Button
            variant="quaternary"
            icon="arrow-left"
            onClick={() => {
              navigate(
                generatePath(ANALYTIC_TABS_ROUTE, {
                  tab: NewAnalyticsTabsOptionsEnum.usage,
                }),
              )
            }}
          />

          <Typography variant="bodyHl" color="grey700">
            {billableMetricCode}
          </Typography>
        </div>
      </PageBannerHeaderWithBurgerMenu>

      <FullscreenPage.Wrapper>
        <div className="flex flex-col gap-6">
          <div>
            <Typography className="text-lg font-semibold text-grey-700">
              {billableMetricCode}
            </Typography>

            <div className="flex flex-col">
              <Filters.Provider
                filtersNamePrefix={ANALYTICS_USAGE_BILLABLE_METRIC_FILTER_PREFIX}
                staticFilters={{
                  currency: defaultCurrency,
                  date: getDefaultStaticDateFilter(),
                }}
                staticQuickFilters={{
                  timeGranularity: getDefaultStaticTimeGranularityFilter(),
                }}
                availableFilters={UsageBillableMetricAvailableFilters}
                quickFiltersType={AvailableQuickFilters.timeGranularity}
                buttonOpener={({ onClick }) => (
                  <Button
                    startIcon="filter"
                    endIcon={!hasAccessToAnalyticsDashboardsFeature ? 'sparkles' : undefined}
                    size="small"
                    variant="quaternary"
                    onClick={(e) => {
                      if (!hasAccessToAnalyticsDashboardsFeature) {
                        e.stopPropagation()
                        premiumWarningDialogRef.current?.openDialog()
                      } else {
                        onClick()
                      }
                    }}
                  >
                    {translate('text_66ab42d4ece7e6b7078993ad')}
                  </Button>
                )}
              >
                <div className="flex items-center justify-between">
                  <Typography variant="subhead" color="grey700">
                    {translate('text_1746541426463b1mm6097u0e')}
                  </Typography>

                  <div className="flex items-center gap-1">
                    <Filters.QuickFilters />
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3">
                  <Filters.Component />
                </div>
              </Filters.Provider>
            </div>
          </div>

          <div>
            <Typography className="mb-2" variant="headline" color="grey700">
              {intlFormatNumber(deserializeAmount(totalAmountCents || 0, selectedCurrency), {
                currencyDisplay: 'symbol',
                currency: selectedCurrency,
              })}
            </Typography>

            <AnalyticsStateProvider>
              <div className="flex flex-col gap-6">
                <StackedBarChart
                  xAxisDataKey="startOfPeriodDt"
                  xAxisTickAttributes={['startOfPeriodDt', 'endOfPeriodDt']}
                  currency={selectedCurrency}
                  data={data}
                  loading={isLoading}
                  timeGranularity={timeGranularity}
                  bars={bars}
                />

                <HorizontalDataTable
                  leftColumnWidth={190}
                  columnWidth={timeGranularity === TimeGranularityEnum.Monthly ? 180 : 228}
                  data={data}
                  loading={isLoading}
                  rows={[
                    {
                      key: 'startOfPeriodDt',
                      type: 'header',
                      label: translate('text_1739268382272qnne2h7slna'),
                      content: (item) => {
                        return (
                          <Typography variant="captionHl">
                            {getItemDateFormatedByTimeGranularity({ item, timeGranularity })}
                          </Typography>
                        )
                      },
                    },
                    ...rows,
                  ]}
                />
              </div>
            </AnalyticsStateProvider>
          </div>
        </div>
      </FullscreenPage.Wrapper>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </>
  )
}

export default UsageBillableMetric
