import { gql } from '@apollo/client'
import Decimal from 'decimal.js'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { HorizontalDataTable, Icon, Typography } from '~/components/designSystem'
import {
  AvailableQuickFilters,
  Filters,
  formatFiltersForRevenueStreamsQuery,
  RevenueStreamsAvailablePopperFilters,
} from '~/components/designSystem/Filters'
import { REVENUE_STREAMS_GRAPH_COLORS } from '~/components/designSystem/graphs/const'
import MultipleLineChart from '~/components/designSystem/graphs/MultipleLineChart'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { REVENUE_STREAMS_OVERVIEW_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { formatDateToTZ } from '~/core/timezone'
import {
  CurrencyEnum,
  TimeGranularityEnum,
  TimezoneEnum,
  useGetRevenueStreamsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'
import { tw } from '~/styles/utils'

gql`
  query getRevenueStreams(
    $currency: CurrencyEnum
    $customerCountry: CountryCode
    $customerType: CustomerTypeEnum
    $externalCustomerId: String
    $externalSubscriptionId: String
    $fromDate: ISO8601Date
    $planCode: String
    $timeGranularity: TimeGranularityEnum
    $toDate: ISO8601Date
  ) {
    dataApiRevenueStreams(
      currency: $currency
      customerCountry: $customerCountry
      customerType: $customerType
      externalCustomerId: $externalCustomerId
      externalSubscriptionId: $externalSubscriptionId
      fromDate: $fromDate
      planCode: $planCode
      timeGranularity: $timeGranularity
      toDate: $toDate
    ) {
      collection {
        amountCurrency
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
    }
  }
`

const RevenueStreamsOverviewSection = () => {
  const [searchParams] = useSearchParams()
  const { translate } = useInternationalization()
  const { organization } = useOrganizationInfos()
  const [clickedDataIndex, setClickedDataIndex] = useState<number | undefined>(undefined)

  const currency = organization?.defaultCurrency || CurrencyEnum.Usd

  const filtersForRevenueStreamsQuery = useMemo(() => {
    return formatFiltersForRevenueStreamsQuery(searchParams)
  }, [searchParams])

  const {
    data: revenueStreamsData,
    loading: revenueStreamsLoading,
    error: revenueStreamsError,
  } = useGetRevenueStreamsQuery({
    variables: {
      ...filtersForRevenueStreamsQuery,
    },
  })
  const displayError = !!revenueStreamsError && !revenueStreamsLoading

  const { lastNetRevenueAmountCents, netRevenueAmountCentsProgressionOnPeriod } = useMemo(() => {
    if (!revenueStreamsData?.dataApiRevenueStreams.collection.length) {
      return {
        lastNetRevenueAmountCents: 0,
        netRevenueAmountCentsProgressionOnPeriod: 0,
      }
    }

    const localFirstNetRevenueAmountCents = Number(
      revenueStreamsData?.dataApiRevenueStreams.collection[0]?.netRevenueAmountCents,
    )
    const localLastNetRevenueAmountCents = Number(
      revenueStreamsData?.dataApiRevenueStreams.collection[
        revenueStreamsData?.dataApiRevenueStreams.collection.length - 1
      ]?.netRevenueAmountCents,
    )

    // Bellow calcul should *100 but values are already in cents so no need to do it
    // Also explain why the toFixed is 4 and not 2
    const localNetRevenueAmountCentsProgressionOnPeriod = new Decimal(
      Number(localLastNetRevenueAmountCents || 0),
    )
      .sub(localFirstNetRevenueAmountCents)
      .dividedBy(localFirstNetRevenueAmountCents || 1)
      .toFixed(4)

    return {
      lastNetRevenueAmountCents: localLastNetRevenueAmountCents,
      netRevenueAmountCentsProgressionOnPeriod: localNetRevenueAmountCentsProgressionOnPeriod,
    }
  }, [revenueStreamsData])

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Filters.Provider
          filtersNamePrefix={REVENUE_STREAMS_OVERVIEW_FILTER_PREFIX}
          staticFilters={{
            currency,
          }}
          staticQuickFilters={{
            timeGranularity: TimeGranularityEnum.Monthly,
          }}
          availableFilters={RevenueStreamsAvailablePopperFilters}
          quickFiltersType={AvailableQuickFilters.timeGranularity}
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
          {intlFormatNumber(deserializeAmount(lastNetRevenueAmountCents || 0, currency), {
            currencyDisplay: 'symbol',
            currency: currency,
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

      {displayError && (
        <GenericPlaceholder
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          image={<ErrorImage width="136" height="104" />}
        />
      )}

      {!displayError && (
        <>
          <MultipleLineChart
            loading={revenueStreamsLoading}
            currency={currency}
            data={revenueStreamsData?.dataApiRevenueStreams.collection}
            xAxisDataKey="startOfPeriodDt"
            setClickedDataIndex={setClickedDataIndex}
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
            data={revenueStreamsData?.dataApiRevenueStreams.collection}
            loading={revenueStreamsLoading}
            clickedDataIndex={clickedDataIndex}
            setClickedDataIndex={setClickedDataIndex}
            rows={[
              {
                key: 'startOfPeriodDt',
                type: 'header',
                label: translate('text_1739268382272qnne2h7slna'),
                content: (item) => (
                  <Typography variant="captionHl">
                    {formatDateToTZ(item.startOfPeriodDt, TimezoneEnum.TzUtc, 'LLL yyyy')}
                  </Typography>
                ),
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
                        deserializeAmount(subscriptionFeeAmountCents || 0, currency),
                        {
                          currencyDisplay: 'symbol',
                          currency: currency,
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
                        deserializeAmount(usageBasedFeeAmountCents || 0, currency),
                        {
                          currencyDisplay: 'symbol',
                          currency: currency,
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
                        deserializeAmount(commitmentFeeAmountCents || 0, currency),
                        {
                          currencyDisplay: 'symbol',
                          currency: currency,
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
                      {intlFormatNumber(deserializeAmount(oneOffFeeAmountCents || 0, currency), {
                        currencyDisplay: 'symbol',
                        currency: currency,
                      })}
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
                      {intlFormatNumber(deserializeAmount(grossRevenueAmountCents || 0, currency), {
                        currencyDisplay: 'symbol',
                        currency: currency,
                      })}
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
                      {intlFormatNumber(deserializeAmount(couponsAmountCents || 0, currency), {
                        currencyDisplay: 'symbol',
                        currency: currency,
                      })}
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
                      {intlFormatNumber(deserializeAmount(netRevenueAmountCents || 0, currency), {
                        currencyDisplay: 'symbol',
                        currency: currency,
                      })}
                    </Typography>
                  )
                },
              },
            ]}
          />
        </>
      )}
    </section>
  )
}

export default RevenueStreamsOverviewSection
