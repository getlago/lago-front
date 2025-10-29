import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import { Button, HorizontalDataTable, InitScrollTo, Typography } from '~/components/designSystem'
import { Filters, ForecastsAvailableFilters } from '~/components/designSystem/Filters'
import MultipleLineChart from '~/components/designSystem/graphs/MultipleLineChart'
import { getItemDateFormatedByTimeGranularity } from '~/components/designSystem/graphs/utils'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { FORECASTS_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, TimeGranularityEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useForecastsAnalyticsOverview } from '~/pages/forecasts/useForecastsAnalyticsOverview'
import { FORECASTS_GRAPH_COLORS } from '~/pages/forecasts/utils'
import ErrorImage from '~/public/images/maneki/error.svg'
import { tw } from '~/styles/utils'

type ForecastsOverviewSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

const ForecastsRowLabel = ({ label, color }: { label: string; color: string }) => (
  <div className="flex items-center gap-2">
    <div className="size-3 rounded-full border-2" style={{ borderColor: color }} />

    <Typography className="font-medium text-grey-700">{label}</Typography>
  </div>
)

const AmountCell = ({
  value,
  className,
  currency,
  showMinusSign = false,
}: {
  value: number
  className: string
  currency: CurrencyEnum
  showMinusSign?: boolean
}) => {
  return (
    <Typography variant="body" className={tw(className)}>
      {showMinusSign && '-'}
      {intlFormatNumber(deserializeAmount(value, currency), {
        currencyDisplay: 'symbol',
        currency,
      })}
    </Typography>
  )
}

export const ForecastsOverviewSection = ({
  premiumWarningDialogRef,
}: ForecastsOverviewSectionProps) => {
  const { translate } = useInternationalization()

  const {
    selectedCurrency,
    defaultCurrency,
    data,
    hasError,
    isLoading,
    timeGranularity,
    hasAccessToForecastsFeature,
  } = useForecastsAnalyticsOverview()

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Filters.Provider
          filtersNamePrefix={FORECASTS_FILTER_PREFIX}
          staticFilters={{
            currency: defaultCurrency,
          }}
          availableFilters={ForecastsAvailableFilters}
          buttonOpener={({ onClick }) => (
            <Button
              startIcon="filter"
              endIcon={!hasAccessToForecastsFeature ? 'sparkles' : undefined}
              size="small"
              variant="quaternary"
              onClick={(e) => {
                if (!hasAccessToForecastsFeature) {
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Typography variant="subhead1" color="grey700">
                  {translate('text_1753014457040hhkl9fy58wy')}
                </Typography>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3">
              <Filters.Component />
            </div>
          </div>
        </Filters.Provider>
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
            xAxisTickAttributes={['endOfPeriodDt', 'endOfPeriodDt']}
            currency={selectedCurrency}
            data={data}
            loading={isLoading}
            timeGranularity={timeGranularity}
            lines={[
              {
                dataKey: 'amountCentsForecastOptimistic',
                colorHex: FORECASTS_GRAPH_COLORS.amountCentsForecastOptimistic,
                tooltipLabel: translate('text_17564701329935iz92g07zaj'),
                strokeDasharray: '3 3',
              },
              {
                dataKey: 'amountCentsForecastRealistic',
                colorHex: FORECASTS_GRAPH_COLORS.amountCentsForecastRealistic,
                tooltipLabel: translate('text_1756470132993ziruszj5lu1'),
                strokeDasharray: '3 3',
              },
              {
                dataKey: 'amountCentsForecastConservative',
                colorHex: FORECASTS_GRAPH_COLORS.amountCentsForecastConservative,
                tooltipLabel: translate('text_1756470132993wnnhcrw15q9'),
                strokeDasharray: '3 3',
              },
            ]}
          />

          <HorizontalDataTable
            leftColumnWidth={220}
            columnWidth={timeGranularity === TimeGranularityEnum.Monthly ? 180 : 228}
            data={data}
            loading={isLoading}
            initScrollTo={InitScrollTo.START}
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
                key: 'amountCentsForecastOptimistic',
                type: 'data',
                label: (
                  <ForecastsRowLabel
                    label={translate('text_17564701329935iz92g07zaj')}
                    color={FORECASTS_GRAPH_COLORS.amountCentsForecastOptimistic}
                  />
                ),
                content: (item) => {
                  const amountCents = Number(item.amountCentsForecastOptimistic) || 0

                  return (
                    <AmountCell
                      className={tw({
                        'text-grey-700': amountCents > 0,
                        'text-grey-500': amountCents === 0,
                      })}
                      value={amountCents}
                      currency={selectedCurrency}
                    />
                  )
                },
              },
              {
                key: 'amountCentsForecastRealistic',
                type: 'data',
                label: (
                  <ForecastsRowLabel
                    label={translate('text_1756470132993ziruszj5lu1')}
                    color={FORECASTS_GRAPH_COLORS.amountCentsForecastRealistic}
                  />
                ),
                content: (item) => {
                  const amountCents = Number(item.amountCentsForecastRealistic) || 0

                  return (
                    <AmountCell
                      className={tw({
                        'text-grey-700': amountCents > 0,
                        'text-grey-500': amountCents === 0,
                      })}
                      value={amountCents}
                      currency={selectedCurrency}
                    />
                  )
                },
              },
              {
                key: 'amountCentsForecastConservative',
                type: 'data',
                label: (
                  <ForecastsRowLabel
                    label={translate('text_1756470132993wnnhcrw15q9')}
                    color={FORECASTS_GRAPH_COLORS.amountCentsForecastConservative}
                  />
                ),
                content: (item) => {
                  const amountCents = Number(item.amountCentsForecastConservative) || 0

                  return (
                    <AmountCell
                      className={tw({
                        'text-grey-700': amountCents > 0,
                        'text-grey-500': amountCents === 0,
                      })}
                      value={amountCents}
                      currency={selectedCurrency}
                    />
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
