import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  formattedUsageDataForAreaChartLoadingFixture,
  formattedUsageDataLoadingFixture,
} from '~/components/analytics/usage/fixture'
import { formatUsageData, formatUsageDataForAreaChart } from '~/components/analytics/usage/utils'
import {
  AvailableFiltersEnum,
  formatFiltersForUsageOverviewQuery,
  getFilterValue,
} from '~/components/designSystem/Filters'
import { ANALYTICS_USAGE_OVERVIEW_FILTER_PREFIX } from '~/core/constants/filters'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  TimeGranularityEnum,
  TimezoneEnum,
  useGetUsageOverviewQuery,
} from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getUsageOverview(
    $currency: CurrencyEnum
    $timeGranularity: TimeGranularityEnum
    $fromDate: ISO8601Date
    $toDate: ISO8601Date
  ) {
    dataApiUsagesAggregatedAmounts(
      currency: $currency
      timeGranularity: $timeGranularity
      fromDate: $fromDate
      toDate: $toDate
    ) {
      collection {
        amountCents
        amountCurrency
        endOfPeriodDt
        startOfPeriodDt
      }
    }
  }
`

const getFilterByKey = (key: AvailableFiltersEnum, searchParams: URLSearchParams) => {
  return getFilterValue({
    key,
    searchParams,
    prefix: ANALYTICS_USAGE_OVERVIEW_FILTER_PREFIX,
  })
}

export const useUsageAnalyticsOverview = () => {
  const [searchParams] = useSearchParams()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()

  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  const defaultCurrency = organization?.defaultCurrency || CurrencyEnum.Usd

  const getDefaultStaticDateFilter = useCallback((): string => {
    const now = DateTime.now().setZone(getTimezoneConfig(TimezoneEnum.TzUtc).name)

    if (!hasAccessToAnalyticsDashboardsFeature) {
      return `${now.minus({ month: 1 }).startOf('day').toISO()},${now.endOf('day').toISO()}`
    }

    return `${now.minus({ month: 12 }).startOf('day').toISO()},${now.endOf('day').toISO()}`
  }, [hasAccessToAnalyticsDashboardsFeature])

  const getDefaultStaticTimeGranularityFilter = useCallback((): string => {
    if (!hasAccessToAnalyticsDashboardsFeature) {
      return TimeGranularityEnum.Daily
    }

    return TimeGranularityEnum.Monthly
  }, [hasAccessToAnalyticsDashboardsFeature])

  const filtersForUsageOverviewQuery = useMemo(() => {
    if (!hasAccessToAnalyticsDashboardsFeature) {
      return {
        currency: defaultCurrency,
        date: getDefaultStaticDateFilter(),
        timeGranularity: getDefaultStaticTimeGranularityFilter(),
      }
    }

    return formatFiltersForUsageOverviewQuery(searchParams)
  }, [
    hasAccessToAnalyticsDashboardsFeature,
    searchParams,
    defaultCurrency,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
  ])

  const {
    data: usageData,
    loading: usageLoading,
    error: usageError,
  } = useGetUsageOverviewQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      ...filtersForUsageOverviewQuery,
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

  const { formattedDataForAreaChart, totalAmountCents } = useMemo(() => {
    const sum = (arr: Array<any>) => arr.reduce((p, c) => p + Number(c.amountCents), 0) // stefan

    const collection = usageData?.dataApiUsagesAggregatedAmounts?.collection

    if (!collection && !!usageLoading) {
      return {
        formattedDataForAreaChart: formattedUsageDataForAreaChartLoadingFixture,
        totalAmountCents: sum(formattedUsageDataLoadingFixture),
      }
    }

    const localFormattedUsageData = formatUsageData({
      searchParams,
      data: usageData?.dataApiUsagesAggregatedAmounts?.collection,
      defaultStaticDatePeriod: getDefaultStaticDateFilter(),
      defaultStaticTimeGranularity: getDefaultStaticTimeGranularityFilter(),
    })

    const localFormattedDataForAreaChart = formatUsageDataForAreaChart({
      data: localFormattedUsageData || [],
      timeGranularity,
      selectedCurrency,
    })

    return {
      formattedDataForAreaChart: localFormattedDataForAreaChart,
      totalAmountCents: sum(localFormattedUsageData),
    }
  }, [
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    usageData?.dataApiUsagesAggregatedAmounts?.collection,
    usageLoading,
    searchParams,
    selectedCurrency,
    timeGranularity,
  ])

  return {
    defaultCurrency,
    hasAccessToAnalyticsDashboardsFeature,
    selectedCurrency,
    timeGranularity,
    formattedDataForAreaChart,
    hasError: !!usageError && !usageLoading,
    isLoading: usageLoading,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    totalAmountCents,
  }
}
