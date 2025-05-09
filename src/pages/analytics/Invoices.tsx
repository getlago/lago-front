import { gql } from '@apollo/client'
import { Button, Icon, Skeleton, Tooltip, Typography } from 'lago-design-system'
import { DateTime } from 'luxon'
import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import {
  getAllDataForInvoicesDisplay,
  getDatesFromPeriod,
} from '~/components/analytics/invoices/utils'
import {
  AnalyticsInvoicesAvailableFilters,
  buildUrlForInvoicesWithFilters,
  Filters,
  formatFiltersForAnalyticsInvoicesQuery,
} from '~/components/designSystem/Filters'
import InlineBarsChart from '~/components/designSystem/graphs/InlineBarsChart'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import { ChartWrapper } from '~/components/layouts/Charts'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { ANALYTICS_INVOICES_FILTER_PREFIX } from '~/core/constants/filters'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  GetInvoiceCollectionsQuery,
  InvoicePaymentStatusTypeEnum,
  PremiumIntegrationTypeEnum,
  useGetInvoiceCollectionsQuery,
  useGetOverdueQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'

gql`
  query getInvoiceCollections($currency: CurrencyEnum!) {
    invoiceCollections(currency: $currency) {
      collection {
        paymentStatus
        invoicesCount
        amountCents
        currency
        month
      }
    }
  }

  query getOverdue($currency: CurrencyEnum!, $externalCustomerId: String, $months: Int!) {
    overdueBalances(currency: $currency, externalCustomerId: $externalCustomerId, months: $months) {
      collection {
        amountCents
        currency
        month
        lagoInvoiceIds
      }
    }
  }
`

export type TInvoiceCollectionsDataResult =
  GetInvoiceCollectionsQuery['invoiceCollections']['collection']

const GRAPH_COLORS = [
  theme.palette.success[400],
  theme.palette.secondary[400],
  theme.palette.grey[300],
]

const LINE_DATA_ALL_KEY_NAME = 'all'

const INVOICE_PAYMENT_STATUS_TRANSLATION_MAP = {
  [InvoicePaymentStatusTypeEnum.Succeeded]: 'text_6553885df387fd0097fd73a3',
  [InvoicePaymentStatusTypeEnum.Failed]: 'text_6553885df387fd0097fd73a5',
  [InvoicePaymentStatusTypeEnum.Pending]: 'text_6553885df387fd0097fd73a7',
}

const Invoices = () => {
  const { translate } = useInternationalization()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()
  const [searchParams] = useSearchParams()
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const [hoveredBarId, setHoveredBarId] = useState<string | undefined>(undefined)

  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  const defaultCurrency = organization?.defaultCurrency || CurrencyEnum.Usd
  const defaultPeriod = AnalyticsPeriodScopeEnum.Year

  const filtersForAnalyticsInvoicesQuery = useMemo(() => {
    if (!hasAccessToAnalyticsDashboardsFeature) {
      return {
        currency: defaultCurrency,
        period: defaultPeriod,
      }
    }

    return formatFiltersForAnalyticsInvoicesQuery(searchParams)
  }, [hasAccessToAnalyticsDashboardsFeature, searchParams, defaultCurrency, defaultPeriod])

  const currency = filtersForAnalyticsInvoicesQuery.currency as CurrencyEnum
  const period = filtersForAnalyticsInvoicesQuery.period as TPeriodScopeTranslationLookupValue

  const {
    data: invoiceCollectionsData,
    loading: invoiceCollectionsLoading,
    error: invoiceCollectionsError,
  } = useGetInvoiceCollectionsQuery({
    variables: {
      currency,
    },
    skip: !currency,
  })

  const {
    data: overdueQueryData,
    loading: overdueQueryLoading,
    error: overdueQueryError,
  } = useGetOverdueQuery({
    variables: { currency, months: 12 },
    skip: !currency,
  })

  const { barGraphData, lineData, totalAmount } = useMemo(() => {
    return getAllDataForInvoicesDisplay({
      data: invoiceCollectionsData?.invoiceCollections.collection,
      currency,
      period,
    })
  }, [currency, invoiceCollectionsData?.invoiceCollections.collection, period])

  const { month } = getDatesFromPeriod(period)

  const overdueData = overdueQueryData?.overdueBalances.collection.reduce<{
    amountCents: number
    invoiceCount: number
  }>(
    (acc, item) => {
      const itemMonth = DateTime.fromISO(item.month as string).month

      if (period === AnalyticsPeriodScopeEnum.Month && itemMonth !== month) {
        return acc
      }

      const formattedAmountCents = deserializeAmount(item.amountCents, item.currency)

      return {
        amountCents: acc.amountCents + formattedAmountCents,
        invoiceCount: acc.invoiceCount + item.lagoInvoiceIds.length,
      }
    },
    {
      amountCents: 0,
      invoiceCount: 0,
    },
  )

  const error = invoiceCollectionsError || overdueQueryError
  const loading = invoiceCollectionsLoading || overdueQueryLoading

  const balances: Array<[string, number]> = [
    ['text_1746524463326xwlgt1hv5se', deserializeAmount(totalAmount, currency)],
    ['text_1746524463326uzhfmw9wa51', overdueData?.amountCents || 0],
    [
      'text_17465244633260sz1d0bnp8v',
      deserializeAmount(
        lineData.get(InvoicePaymentStatusTypeEnum.Pending)?.amountCents || 0,
        currency,
      ),
    ],
  ]

  return (
    <FullscreenPage.Wrapper>
      <div className="flex flex-col gap-4">
        <Typography className="flex items-center gap-2" variant="headline" color="grey700">
          {translate('text_1745933666707rlg89cuv1i0')}

          <Tooltip
            placement="top-start"
            title={translate('text_1746535056345h6ij1b79vyo')}
            className="flex"
          >
            <Icon name="info-circle" className="text-grey-600" />
          </Tooltip>
        </Typography>

        <div className="flex flex-col">
          <Filters.Provider
            filtersNamePrefix={ANALYTICS_INVOICES_FILTER_PREFIX}
            staticFilters={{
              currency: defaultCurrency,
              period: defaultPeriod,
            }}
            availableFilters={AnalyticsInvoicesAvailableFilters}
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
            <div className="flex w-full flex-col gap-3">
              <Filters.Component />
            </div>
          </Filters.Provider>
        </div>
      </div>

      {!!error && (
        <GenericPlaceholder
          className="m-0 p-0"
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          image={<ErrorImage width="136" height="104" />}
        />
      )}

      {!error && (
        <>
          <div className="flex flex-col gap-6">
            <Typography className="flex items-center gap-2 text-lg font-semibold text-grey-700">
              {translate('text_1746526888530pbjcvaaox2c')}
            </Typography>

            <div className="flex w-full">
              {balances.map(([label, amount], index) => (
                <div className="flex flex-1 flex-col gap-1" key={`pages-analytics-${index}`}>
                  <Typography className="text-2xl font-semibold text-grey-700">
                    {intlFormatNumber(amount, {
                      currency,
                    })}
                  </Typography>
                  <Typography className="text-grey-600">{translate(label as string)}</Typography>
                </div>
              ))}
            </div>
          </div>

          <ChartWrapper>
            <div className="flex flex-col gap-6">
              <Typography className="text-lg font-semibold text-grey-700">
                {translate('text_1745934224037o00zwo5xesp')}
              </Typography>

              {!!loading && (
                <>
                  <Skeleton variant="text" />

                  <div>
                    {[...Array(3)].map((_, index) => (
                      <div className="flex items-center gap-10" key={`invoices-skeleton-${index}`}>
                        <Skeleton variant="circular" size="tiny" />
                        <Skeleton variant="text" className="w-[32%]" />
                        <Skeleton variant="text" className="w-[32%]" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!loading && (
                <>
                  <InlineBarsChart
                    data={barGraphData}
                    colors={GRAPH_COLORS}
                    hoveredBarId={hoveredBarId}
                    lineHeight={24}
                  />

                  <div className="mx-1">
                    <div className="flex items-center justify-between border-b border-grey-300 pb-3">
                      <Typography className="text-sm font-medium text-grey-600">
                        {translate('text_17464599455321p5nbjbsg2o')}
                      </Typography>

                      <Typography className="text-sm font-medium text-grey-600">
                        {translate('text_17346988752182hpzppdqk9t')}
                      </Typography>
                    </div>

                    <div>
                      {[
                        InvoicePaymentStatusTypeEnum.Succeeded,
                        InvoicePaymentStatusTypeEnum.Failed,
                        InvoicePaymentStatusTypeEnum.Pending,
                      ].map((status, index) => {
                        const linkParams = new URLSearchParams()

                        linkParams.set('paymentStatus', status)

                        return (
                          <Link
                            className="hover:no-underline focus:ring-0 focus-visible:ring-0"
                            to={buildUrlForInvoicesWithFilters(linkParams)}
                            key={`invoices-item-${status}-${index}`}
                          >
                            <div
                              className="flex items-center justify-between border-b border-grey-300 py-3"
                              onMouseEnter={() => setHoveredBarId(status)}
                              onMouseLeave={() => setHoveredBarId(undefined)}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-3 rounded-full"
                                  style={{ backgroundColor: GRAPH_COLORS[index] }}
                                />

                                <Typography className="font-medium text-grey-700">
                                  {translate(INVOICE_PAYMENT_STATUS_TRANSLATION_MAP[status], {
                                    count: lineData.get(status)?.invoicesCount,
                                  })}
                                </Typography>
                              </div>

                              <Typography className="text-grey-600">
                                {intlFormatNumber(
                                  deserializeAmount(
                                    lineData.get(status)?.amountCents || 0,
                                    currency,
                                  ),
                                  { currency },
                                )}
                              </Typography>
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between border-b border-grey-300 py-3">
                      <Typography className="font-medium text-grey-700">
                        {translate('text_1746536317559r1gbassfgec')}
                      </Typography>

                      <Typography className="text-grey-700">
                        {intlFormatNumber(
                          deserializeAmount(
                            lineData.get(LINE_DATA_ALL_KEY_NAME)?.amountCents || 0,
                            currency,
                          ),
                          {
                            currency,
                          },
                        )}
                      </Typography>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ChartWrapper>
        </>
      )}

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </FullscreenPage.Wrapper>
  )
}

export default Invoices
