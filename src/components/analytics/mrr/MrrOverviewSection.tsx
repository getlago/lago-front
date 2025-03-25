import { gql } from '@apollo/client'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { useMrrAnalyticsOverview } from '~/components/analytics/mrr/useMrrAnalyticsOverview'
import { Button, HorizontalDataTable, Icon, Typography } from '~/components/designSystem'
import {
  AvailableQuickFilters,
  Filters,
  MrrOverviewAvailableFilters,
} from '~/components/designSystem/Filters'
import AreaChart from '~/components/designSystem/graphs/AreaChart'
import { getItemDateFormatedByTimeGranularity } from '~/components/designSystem/graphs/utils'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { MRR_BREAKDOWN_OVERVIEW_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  fragment MrrDataForOverviewSection on DataApiMrr {
    endOfPeriodDt
    endingMrr
    mrrChange
    mrrChurn
    mrrContraction
    mrrExpansion
    mrrNew
    startOfPeriodDt
    startingMrr
  }
`

type MrrOverviewSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

export const MrrOverviewSection = ({ premiumWarningDialogRef }: MrrOverviewSectionProps) => {
  const { translate } = useInternationalization()
  const {
    selectedCurrency,
    defaultCurrency,
    data,
    hasError,
    isLoading,
    lastMrrAmountCents,
    mrrAmountCentsProgressionOnPeriod,
    timeGranularity,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    hasAccessToAnalyticsDashboardsFeature,
  } = useMrrAnalyticsOverview()

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Filters.Provider
          filtersNamePrefix={MRR_BREAKDOWN_OVERVIEW_FILTER_PREFIX}
          staticFilters={{
            currency: defaultCurrency,
            date: getDefaultStaticDateFilter(),
          }}
          staticQuickFilters={{
            timeGranularity: getDefaultStaticTimeGranularityFilter(),
          }}
          availableFilters={MrrOverviewAvailableFilters}
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
          {intlFormatNumber(deserializeAmount(lastMrrAmountCents || 0, selectedCurrency), {
            currencyDisplay: 'symbol',
            currency: selectedCurrency,
          })}
        </Typography>
        <div className="flex items-center gap-2">
          <Icon
            name={
              Number(mrrAmountCentsProgressionOnPeriod) > 0
                ? 'arrow-up-circle-filled'
                : 'arrow-down-circle-filled'
            }
            color={Number(mrrAmountCentsProgressionOnPeriod) > 0 ? 'success' : 'error'}
          />
          <div className="flex items-center gap-1">
            <Typography
              variant="caption"
              color={Number(mrrAmountCentsProgressionOnPeriod) > 0 ? 'success600' : 'danger600'}
            >
              {intlFormatNumber(Number(mrrAmountCentsProgressionOnPeriod), {
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
          <AreaChart
            blur={false}
            currency={selectedCurrency}
            data={data.map((d) => ({
              axisName: d.startOfPeriodDt,
              value: d.mrrNew,
              tooltipLabel: translate('text_1739268382272qnne2h7slna'),
            }))}
            loading={isLoading}
          />

          <HorizontalDataTable
            leftColumnWidth={190}
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
                key: 'mrrNew',
                type: 'data',
                label: translate('text_1742831422968chcjxyc2qjo'),
                content: (item) => {
                  return (
                    <Typography variant="captionHl">
                      {intlFormatNumber(deserializeAmount(item.mrrNew, selectedCurrency), {
                        currencyDisplay: 'symbol',
                        currency: selectedCurrency,
                      })}
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
