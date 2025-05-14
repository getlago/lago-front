import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  formattedUsageDataForAreaChartLoadingFixture,
  formattedUsageDataForBreakdownBarChartLoadingFixture,
  formattedUsageDataLoadingFixture,
} from '~/components/analytics/usage/fixture'
import {
  formatUsageBillableMetricData,
  formatUsageDataForAreaChart,
} from '~/components/analytics/usage/utils'
import {
  AvailableFiltersEnum,
  formatFiltersForUsageBillableMetricQuery,
  getFilterValue,
} from '~/components/designSystem/Filters'
import { ANALYTICS_USAGE_BILLABLE_METRIC_FILTER_PREFIX } from '~/core/constants/filters'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  TimeGranularityEnum,
  TimezoneEnum,
  useGetUsageBillableMetricQuery,
} from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getUsageBillableMetric(
    $currency: CurrencyEnum
    $timeGranularity: TimeGranularityEnum
    $fromDate: ISO8601Date
    $toDate: ISO8601Date
  ) {
    dataApiUsages(
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
    prefix: ANALYTICS_USAGE_BILLABLE_METRIC_FILTER_PREFIX,
  })
}

export const useUsageAnalyticsBillableMetric = () => {
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

  const filtersForUsageBillableMetricQuery = useMemo(() => {
    if (!hasAccessToAnalyticsDashboardsFeature) {
      return {
        currency: defaultCurrency,
        date: getDefaultStaticDateFilter(),
        timeGranularity: getDefaultStaticTimeGranularityFilter(),
      }
    }

    return formatFiltersForUsageBillableMetricQuery(searchParams)
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
  } = useGetUsageBillableMetricQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      ...filtersForUsageBillableMetricQuery,
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

  const { formattedUsageData, totalAmountCents } = useMemo(() => {
    const sum = (arr: Array<any>) => arr.reduce((p, c) => p + Number(c.amountCents), 0) // stefan

    const collection = usageData?.dataApiUsages?.collection

    if (!collection && !!usageLoading) {
      return {
        totalAmountCents: sum(formattedUsageDataLoadingFixture),
      }
    }

    const localFormattedUsageData = formatUsageBillableMetricData({
      searchParams,
      data: collection,
      defaultStaticDatePeriod: getDefaultStaticDateFilter(),
      defaultStaticTimeGranularity: getDefaultStaticTimeGranularityFilter(),
    })

    return {
      formattedUsageData: localFormattedUsageData,
      totalAmountCents: sum(localFormattedUsageData),
    }
  }, [
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    usageData?.dataApiUsages?.collection,
    usageLoading,
    searchParams,
  ])

  return {
    data: formattedUsageData,
    defaultCurrency,
    hasAccessToAnalyticsDashboardsFeature,
    selectedCurrency,
    timeGranularity,
    hasError: !!usageError && !usageLoading,
    isLoading: usageLoading,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    totalAmountCents,
  }
}
