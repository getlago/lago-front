import { gql } from '@apollo/client'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { useRevenueAnalyticsOverview } from '~/components/analytics/revenueStreams/useRevenueAnalyticsOverview'
import { Button, HorizontalDataTable, Icon, Typography } from '~/components/designSystem'
import {
  AvailableQuickFilters,
  Filters,
  RevenueStreamsAvailablePopperFilters,
} from '~/components/designSystem/Filters'
import { REVENUE_STREAMS_GRAPH_COLORS } from '~/components/designSystem/graphs/const'
import MultipleLineChart from '~/components/designSystem/graphs/MultipleLineChart'
import { getItemDateFormatedByTimeGranularity } from '~/components/designSystem/graphs/utils'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { REVENUE_STREAMS_OVERVIEW_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { TimeGranularityEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { tw } from '~/styles/utils'

gql`
  fragment RevenueStreamDataForOverviewSection on DataApiRevenueStream {
    commitmentFeeAmountCents
    couponsAmountCents
    endOfPeriodDt
    grossRevenueAmountCents
    netRevenueAmountCents
    oneOffFeeAmountCents
    startOfPeriodDt
    subscriptionFeeAmountCents
    usageBasedFeeAmountCents
  }
`

type RevenueStreamsOverviewSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

export const RevenueStreamsOverviewSection = ({
  premiumWarningDialogRef,
}: RevenueStreamsOverviewSectionProps) => {
  const { translate } = useInternationalization()
  const {
    selectedCurrency,
    defaultCurrency,
    data,
    hasError,
    isLoading,
    lastNetRevenueAmountCents,
    netRevenueAmountCentsProgressionOnPeriod,
    timeGranularity,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    hasAccessToAnalyticsDashboardsFeature,
  } = useRevenueAnalyticsOverview()

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Filters.Provider
          filtersNamePrefix={REVENUE_STREAMS_OVERVIEW_FILTER_PREFIX}
          staticFilters={{
            currency: defaultCurrency,
            date: getDefaultStaticDateFilter(),
          }}
          staticQuickFilters={{
            timeGranularity: getDefaultStaticTimeGranularityFilter(),
          }}
          availableFilters={RevenueStreamsAvailablePopperFilters}
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
              {translate('text_634687079be251fdb43833b7')}
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

      <div className="flex flex-col gap-1">
        <Typography variant="headline" color="grey700">
          {intlFormatNumber(deserializeAmount(lastNetRevenueAmountCents || 0, selectedCurrency), {
            currencyDisplay: 'symbol',
            currency: selectedCurrency,
          })}
        </Typography>
        <div className="flex items-center gap-2">
          <Icon
            name={
              Number(netRevenueAmountCentsProgressionOnPeriod) > 0
                ? 'arrow-up-circle-filled'
                : 'arrow-down-circle-filled'
            }
            color={Number(netRevenueAmountCentsProgressionOnPeriod) > 0 ? 'success' : 'error'}
          />
          <div className="flex items-center gap-1">
            <Typography
              variant="caption"
              color={
                Number(netRevenueAmountCentsProgressionOnPeriod) > 0 ? 'success600' : 'danger600'
              }
            >
              {intlFormatNumber(Number(netRevenueAmountCentsProgressionOnPeriod), {
                style: 'percent',
              })}
            </Typography>
            <Typography variant="caption" color="grey700">
              {translate('text_174048163137011wdtjb1xfg')}
            </Typography>
          </div>
        </div>
      </div>

      {hasError && (
        <GenericPlaceholder
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          image={<ErrorImage width="136" height="104" />}
        />
      )}

      {!hasError && (
        <AnalyticsStateProvider>
          <MultipleLineChart
            xAxisDataKey="startOfPeriodDt"
            xAxisTickAttributes={['startOfPeriodDt', 'endOfPeriodDt']}
            currency={selectedCurrency}
            data={data}
            loading={isLoading}
            timeGranularity={timeGranularity}
            lines={[
              {
                dataKey: 'subscriptionFeeAmountCents',
                colorHex: REVENUE_STREAMS_GRAPH_COLORS.subscriptionFeeAmountCents,
                tooltipLabel: translate('text_1728472697691k6k2e9m5ibb'),
              },
              {
                dataKey: 'usageBasedFeeAmountCents',
                colorHex: REVENUE_STREAMS_GRAPH_COLORS.usageBasedFeeAmountCents,
                tooltipLabel: translate('text_1725983967306cei92rkdtvb'),
              },
              {
                dataKey: 'commitmentFeeAmountCents',
                colorHex: REVENUE_STREAMS_GRAPH_COLORS.commitmentFeeAmountCents,
                tooltipLabel: translate('text_1739270764222q8lrgvllulk'),
              },
              {
                dataKey: 'oneOffFeeAmountCents',
                colorHex: REVENUE_STREAMS_GRAPH_COLORS.oneOffFeeAmountCents,
                tooltipLabel: translate('text_1728472697691t126b808cm9'),
              },
              {
                hideOnGraph: true,
                dataKey: 'grossRevenueAmountCents',
                tooltipLabel: translate('text_1739869126030nbuobu5baxi'),
              },
              {
                hideOnGraph: true,
                dataKey: 'couponsAmountCents',
                tooltipLabel: translate('text_637ccf8133d2c9a7d11ce705'),
              },
              {
                hideOnGraph: true,
                dataKey: 'netRevenueAmountCents',
                tooltipLabel: translate('text_1739869126030kuxz0uvfj02'),
              },
            ]}
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
              {
                key: 'subscriptionFeeAmountCents',
                type: 'data',
                label: (
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor: REVENUE_STREAMS_GRAPH_COLORS.subscriptionFeeAmountCents,
                      }}
                    ></div>
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_1728472697691k6k2e9m5ibb')}
                    </Typography>
                  </div>
                ),
                content: (item) => {
                  const subscriptionFeeAmountCents = Number(item.subscriptionFeeAmountCents) || 0

                  return (
                    <Typography
                      variant="body"
                      className={tw({
                        'text-green-600': subscriptionFeeAmountCents > 0,
                        'text-grey-500': subscriptionFeeAmountCents === 0,
                      })}
                    >
                      {intlFormatNumber(
                        deserializeAmount(subscriptionFeeAmountCents || 0, selectedCurrency),
                        {
                          currencyDisplay: 'symbol',
                          currency: selectedCurrency,
                        },
                      )}
                    </Typography>
                  )
                },
              },
              {
                key: 'usageBasedFeeAmountCents',
                type: 'data',
                label: (
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor: REVENUE_STREAMS_GRAPH_COLORS.usageBasedFeeAmountCents,
                      }}
                    ></div>
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_1725983967306cei92rkdtvb')}
                    </Typography>
                  </div>
                ),
                content: (item) => {
                  const usageBasedFeeAmountCents = Number(item.usageBasedFeeAmountCents) || 0

                  return (
                    <Typography
                      variant="body"
                      className={tw({
                        'text-green-600': usageBasedFeeAmountCents > 0,
                        'text-grey-500': usageBasedFeeAmountCents === 0,
                      })}
                    >
                      {intlFormatNumber(
                        deserializeAmount(usageBasedFeeAmountCents || 0, selectedCurrency),
                        {
                          currencyDisplay: 'symbol',
                          currency: selectedCurrency,
                        },
                      )}
                    </Typography>
                  )
                },
              },
              {
                key: 'commitmentFeeAmountCents',
                type: 'data',
                label: (
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor: REVENUE_STREAMS_GRAPH_COLORS.commitmentFeeAmountCents,
                      }}
                    ></div>
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_1739270764222q8lrgvllulk')}
                    </Typography>
                  </div>
                ),
                content: (item) => {
                  const commitmentFeeAmountCents = Number(item.commitmentFeeAmountCents) || 0

                  return (
                    <Typography
                      variant="body"
                      className={tw({
                        'text-green-600': commitmentFeeAmountCents > 0,
                        'text-grey-500': commitmentFeeAmountCents === 0,
                      })}
                    >
                      {intlFormatNumber(
                        deserializeAmount(commitmentFeeAmountCents || 0, selectedCurrency),
                        {
                          currencyDisplay: 'symbol',
                          currency: selectedCurrency,
                        },
                      )}
                    </Typography>
                  )
                },
              },
              {
                key: 'oneOffFeeAmountCents',
                type: 'data',
                label: (
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor: REVENUE_STREAMS_GRAPH_COLORS.oneOffFeeAmountCents,
                      }}
                    ></div>
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_1728472697691t126b808cm9')}
                    </Typography>
                  </div>
                ),
                content: (item) => {
                  const oneOffFeeAmountCents = Number(item.oneOffFeeAmountCents) || 0

                  return (
                    <Typography
                      variant="body"
                      className={tw({
                        'text-green-600': oneOffFeeAmountCents > 0,
                        'text-grey-500': oneOffFeeAmountCents === 0,
                      })}
                    >
                      {intlFormatNumber(
                        deserializeAmount(oneOffFeeAmountCents || 0, selectedCurrency),
                        {
                          currencyDisplay: 'symbol',
                          currency: selectedCurrency,
                        },
                      )}
                    </Typography>
                  )
                },
              },
              {
                key: 'grossRevenueAmountCents',
                type: 'data',
                label: (
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_1739869126030nbuobu5baxi')}
                  </Typography>
                ),
                content: (item) => {
                  const grossRevenueAmountCents = Number(item.grossRevenueAmountCents) || 0

                  return (
                    <Typography
                      variant="body"
                      className={tw({
                        'text-grey-700': grossRevenueAmountCents > 0,
                        'text-grey-500': grossRevenueAmountCents === 0,
                      })}
                    >
                      {intlFormatNumber(
                        deserializeAmount(grossRevenueAmountCents || 0, selectedCurrency),
                        {
                          currencyDisplay: 'symbol',
                          currency: selectedCurrency,
                        },
                      )}
                    </Typography>
                  )
                },
              },
              {
                key: 'couponsAmountCents',
                type: 'data',
                label: (
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_637ccf8133d2c9a7d11ce705')}
                  </Typography>
                ),
                content: (item) => {
                  const couponsAmountCents = Number(item.couponsAmountCents) || 0

                  return (
                    <Typography
                      variant="body"
                      className={tw({
                        'text-red-600': couponsAmountCents > 0,
                        'text-grey-500': couponsAmountCents === 0,
                      })}
                    >
                      {couponsAmountCents > 0 && '-'}
                      {intlFormatNumber(
                        deserializeAmount(couponsAmountCents || 0, selectedCurrency),
                        {
                          currencyDisplay: 'symbol',
                          currency: selectedCurrency,
                        },
                      )}
                    </Typography>
                  )
                },
              },
              {
                key: 'netRevenueAmountCents',
                type: 'data',
                label: (
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_1739869126030kuxz0uvfj02')}
                  </Typography>
                ),
                content: (item) => {
                  const netRevenueAmountCents = Number(item.netRevenueAmountCents) || 0

                  return (
                    <Typography
                      variant="body"
                      className={tw({
                        'text-grey-700': netRevenueAmountCents > 0,
                        'text-grey-500': netRevenueAmountCents === 0,
                      })}
                    >
                      {intlFormatNumber(
                        deserializeAmount(netRevenueAmountCents || 0, selectedCurrency),
                        {
                          currencyDisplay: 'symbol',
                          currency: selectedCurrency,
                        },
                      )}
                    </Typography>
                  )
                },
              },
            ]}
          />
        </AnalyticsStateProvider>
      )}
    </section>
  )
}
