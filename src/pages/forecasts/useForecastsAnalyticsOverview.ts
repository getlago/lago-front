import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AvailableFiltersEnum } from '~/components/designSystem/Filters'
import {
  formatFiltersForForecastsQuery,
  getFilterValue,
} from '~/components/designSystem/Filters/utils'
import { FORECASTS_FILTER_PREFIX } from '~/core/constants/filters'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CurrencyEnum,
  DataApiUsageForecasted,
  PremiumIntegrationTypeEnum,
  TimeGranularityEnum,
  TimezoneEnum,
  useGetForecastsQuery,
} from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { formatForecastsData } from '~/pages/forecasts/utils'

gql`
  query getForecasts(
    $billingEntityCode: String
    $currency: CurrencyEnum
    $customerCountry: CountryCode
    $customerType: CustomerTypeEnum
    $externalCustomerId: String
    $isCustomerTinEmpty: Boolean
    $externalSubscriptionId: String
    $planCode: String
    $fromDate: ISO8601Date
    $toDate: ISO8601Date
    $timeGranularity: TimeGranularityEnum
  ) {
    dataApiUsagesForecasted(
      billingEntityCode: $billingEntityCode
      currency: $currency
      customerCountry: $customerCountry
      customerType: $customerType
      externalCustomerId: $externalCustomerId
      isCustomerTinEmpty: $isCustomerTinEmpty
      externalSubscriptionId: $externalSubscriptionId
      planCode: $planCode
      fromDate: $fromDate
      toDate: $toDate
      timeGranularity: $timeGranularity
    ) {
      collection {
        amountCentsForecast10thPercentile
        amountCentsForecast50thPercentile
        amountCentsForecast90thPercentile
        amountCurrency
        endOfPeriodDt
        startOfPeriodDt
      }
    }
  }
`

type ForecastsAnalyticsOverviewReturn = {
  selectedCurrency: CurrencyEnum
  defaultCurrency: CurrencyEnum
  data: DataApiUsageForecasted[]
  hasAccessToForecastsFeature: boolean
  hasError: boolean
  isLoading: boolean
  timeGranularity: TimeGranularityEnum
  getDefaultStaticDateFilter: () => string
  getDefaultStaticTimeGranularityFilter: () => string
}

const getFilterByKey = (key: AvailableFiltersEnum, searchParams: URLSearchParams) => {
  return getFilterValue({
    key,
    searchParams,
    prefix: FORECASTS_FILTER_PREFIX,
  })
}

export const useForecastsAnalyticsOverview = (): ForecastsAnalyticsOverviewReturn => {
  const [searchParams] = useSearchParams()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()

  const hasAccessToForecastsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  const defaultCurrency = organization?.defaultCurrency || CurrencyEnum.Usd

  const getDefaultStaticDateFilter = useCallback((): string => {
    const now = DateTime.now().setZone(getTimezoneConfig(TimezoneEnum.TzUtc).name)

    if (!hasAccessToForecastsFeature) {
      return `${now.minus({ month: 1 }).startOf('day').toISO()},${now.endOf('day').toISO()}`
    }

    return `${now.minus({ month: 12 }).startOf('day').toISO()},${now.endOf('day').toISO()}`
  }, [hasAccessToForecastsFeature])

  const getDefaultStaticTimeGranularityFilter = useCallback((): string => {
    if (!hasAccessToForecastsFeature) {
      return TimeGranularityEnum.Daily
    }

    return TimeGranularityEnum.Monthly
  }, [hasAccessToForecastsFeature])

  const filtersForForecastsQuery = useMemo(() => {
    if (!hasAccessToForecastsFeature) {
      return {
        currency: defaultCurrency,
        date: getDefaultStaticDateFilter(),
        timeGranularity: getDefaultStaticTimeGranularityFilter(),
      }
    }

    return formatFiltersForForecastsQuery(searchParams)
  }, [
    hasAccessToForecastsFeature,
    searchParams,
    defaultCurrency,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
  ])

  const {
    data: forecastsData,
    loading: forecastsLoading,
    error: forecastsError,
  } = useGetForecastsQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      ...filtersForForecastsQuery,
    },
  })

  const timeGranularity = getFilterByKey(
    AvailableFiltersEnum.timeGranularity,
    searchParams,
  ) as TimeGranularityEnum

  const selectedCurrency = useMemo(() => {
    const currencyFromFilter = getFilterByKey(AvailableFiltersEnum.currency, searchParams)

    if (!!currencyFromFilter) {
      return currencyFromFilter as CurrencyEnum
    }
    return defaultCurrency
  }, [searchParams, defaultCurrency])

  const formattedForecastsData = useMemo(() => {
    return formatForecastsData({
      searchParams,
      data: forecastsData?.dataApiUsagesForecasted?.collection,
      defaultStaticDatePeriod: getDefaultStaticDateFilter(),
      defaultStaticTimeGranularity: getDefaultStaticTimeGranularityFilter(),
    })
  }, [
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    forecastsData?.dataApiUsagesForecasted.collection,
    searchParams,
  ])

  return {
    defaultCurrency,
    hasAccessToForecastsFeature,
    selectedCurrency,
    timeGranularity,
    data: formattedForecastsData,
    hasError: !!forecastsError && !forecastsLoading,
    isLoading: forecastsLoading,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
  }
}
