import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { UsageBreakdownType } from '~/components/analytics/usage/types'
import {
  AvailableFiltersEnum,
  formatFiltersForQuery,
  getFilterValue,
} from '~/components/designSystem/Filters'
import { bigNumberShortenNotation } from '~/core/formats/intlFormatNumber'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  TimeGranularityEnum,
  TimezoneEnum,
  useGetUsageBreakdownQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getUsageBreakdown(
    $currency: CurrencyEnum
    $timeGranularity: TimeGranularityEnum
    $fromDate: ISO8601Date
    $toDate: ISO8601Date
    $isBillableMetricRecurring: Boolean
  ) {
    dataApiUsages(
      currency: $currency
      timeGranularity: $timeGranularity
      fromDate: $fromDate
      toDate: $toDate
      isBillableMetricRecurring: $isBillableMetricRecurring
    ) {
      collection {
        startOfPeriodDt
        endOfPeriodDt
        amountCurrency
        amountCents
        billableMetricCode
        units
      }
    }
  }
`

const getFilterByKey = (
  key: AvailableFiltersEnum,
  searchParams: URLSearchParams,
  prefix: string,
) => {
  return getFilterValue({
    key,
    searchParams,
    prefix,
  })
}

type UseUsageAnalyticsBreakdownProps = {
  availableFilters: AvailableFiltersEnum[]
  filtersPrefix: string
  isBillableMetricRecurring?: boolean
  breakdownType: UsageBreakdownType
}

export const useUsageAnalyticsBreakdown = ({
  availableFilters,
  filtersPrefix,
  isBillableMetricRecurring,
  breakdownType,
}: UseUsageAnalyticsBreakdownProps) => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()

  const ACCESSORS: Record<
    UsageBreakdownType,
    {
      valueKey: 'units' | 'amountCents'
      displayFormat?: (value: string | number, currency: CurrencyEnum) => string
    }
  > = {
    [UsageBreakdownType.Amount]: {
      valueKey: 'amountCents',
    },
    [UsageBreakdownType.Units]: {
      valueKey: 'units',
      displayFormat: (value) =>
        `${bigNumberShortenNotation(Number(value))} ${translate('text_17476657511358tgyvof5x1u', undefined, Number(value) || 0)}`,
    },
  }

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

  const getDefaultStaticTimeGranularityFilter = useCallback((): TimeGranularityEnum => {
    return TimeGranularityEnum.Weekly
  }, [])

  const filtersForUsageBreakdownQuery = useMemo(() => {
    if (!hasAccessToAnalyticsDashboardsFeature) {
      return {
        currency: defaultCurrency,
        date: getDefaultStaticDateFilter(),
        timeGranularity: getDefaultStaticTimeGranularityFilter(),
      }
    }

    const filters = formatFiltersForQuery({
      searchParams,
      availableFilters: availableFilters,
      filtersNamePrefix: filtersPrefix,
    })

    return {
      ...filters,
      timeGranularity: getDefaultStaticTimeGranularityFilter(),
      isBillableMetricRecurring,
    }
  }, [
    hasAccessToAnalyticsDashboardsFeature,
    searchParams,
    defaultCurrency,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    availableFilters,
    filtersPrefix,
    isBillableMetricRecurring,
  ])

  const {
    data: usageData,
    loading: usageLoading,
    error: usageError,
  } = useGetUsageBreakdownQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      ...filtersForUsageBreakdownQuery,
    },
  })

  const selectedCurrency = useMemo(() => {
    const currencyFromFilter = getFilterByKey(
      AvailableFiltersEnum.currency,
      searchParams,
      filtersPrefix,
    )

    if (!!currencyFromFilter) {
      return currencyFromFilter as CurrencyEnum
    }

    return defaultCurrency
  }, [searchParams, defaultCurrency, filtersPrefix])

  const accessor = ACCESSORS[breakdownType]

  return {
    data: usageData?.dataApiUsages?.collection,
    defaultCurrency,
    hasAccessToAnalyticsDashboardsFeature,
    selectedCurrency,
    timeGranularity: getDefaultStaticTimeGranularityFilter(),
    hasError: !!usageError && !usageLoading,
    isLoading: usageLoading,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    valueKey: accessor.valueKey,
    displayFormat: accessor.displayFormat,
  }
}
