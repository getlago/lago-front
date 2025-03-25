import { gql } from '@apollo/client'
import Decimal from 'decimal.js'
import { DateTime } from 'luxon'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { formatMrrData } from '~/components/analytics/mrr/utils'
import { AvailableFiltersEnum } from '~/components/designSystem/Filters'
import { formatFiltersForMrrQuery, getFilterValue } from '~/components/designSystem/Filters/utils'
import { MRR_BREAKDOWN_OVERVIEW_FILTER_PREFIX } from '~/core/constants/filters'
import {
  CurrencyEnum,
  MrrDataForOverviewSectionFragment,
  MrrDataForOverviewSectionFragmentDoc,
  PremiumIntegrationTypeEnum,
  TimeGranularityEnum,
  useGetMrrsQuery,
} from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  query getMrrs(
    $currency: CurrencyEnum
    $customerCountry: CountryCode
    $customerType: CustomerTypeEnum
    $externalCustomerId: String
    $fromDate: ISO8601Date
    $planCode: String
    $timeGranularity: TimeGranularityEnum
    $toDate: ISO8601Date
  ) {
    dataApiMrrs(
      currency: $currency
      customerCountry: $customerCountry
      customerType: $customerType
      externalCustomerId: $externalCustomerId
      fromDate: $fromDate
      planCode: $planCode
      timeGranularity: $timeGranularity
      toDate: $toDate
    ) {
      collection {
        ...MrrDataForOverviewSection
      }
    }
  }

  ${MrrDataForOverviewSectionFragmentDoc}
`

type MrrAnalyticsOverviewReturn = {
  selectedCurrency: CurrencyEnum
  defaultCurrency: CurrencyEnum
  data: MrrDataForOverviewSectionFragment[]
  hasAccessToAnalyticsDashboardsFeature: boolean
  hasError: boolean
  isLoading: boolean
  lastMrrAmountCents: string
  mrrAmountCentsProgressionOnPeriod: string
  timeGranularity: TimeGranularityEnum
  getDefaultStaticDateFilter: () => string
  getDefaultStaticTimeGranularityFilter: () => string
}

const getFilterByKey = (key: AvailableFiltersEnum, searchParams: URLSearchParams) => {
  return getFilterValue({
    key,
    searchParams,
    prefix: MRR_BREAKDOWN_OVERVIEW_FILTER_PREFIX,
  })
}

export const useMrrAnalyticsOverview = (): MrrAnalyticsOverviewReturn => {
  const [searchParams] = useSearchParams()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()

  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  const defaultCurrency = organization?.defaultCurrency || CurrencyEnum.Usd

  const getDefaultStaticDateFilter = useCallback((): string => {
    const now = DateTime.now()

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

  const filtersForMrrQuery = useMemo(() => {
    if (!hasAccessToAnalyticsDashboardsFeature) {
      return {
        currency: defaultCurrency,
        date: getDefaultStaticDateFilter(),
        timeGranularity: getDefaultStaticTimeGranularityFilter(),
      }
    }

    return formatFiltersForMrrQuery(searchParams)
  }, [
    hasAccessToAnalyticsDashboardsFeature,
    searchParams,
    defaultCurrency,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
  ])

  const {
    data: mrrData,
    loading: mrrLoading,
    error: mrrError,
  } = useGetMrrsQuery({
    variables: {
      ...filtersForMrrQuery,
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

  const formattedMrrData = useMemo(() => {
    return formatMrrData({
      searchParams,
      data: mrrData?.dataApiMrrs.collection,
      defaultStaticDatePeriod: getDefaultStaticDateFilter(),
      defaultStaticTimeGranularity: getDefaultStaticTimeGranularityFilter(),
    })
  }, [
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    mrrData?.dataApiMrrs.collection,
    searchParams,
  ])

  const { lastMrrAmountCents, mrrAmountCentsProgressionOnPeriod } = useMemo(() => {
    if (!formattedMrrData?.length) {
      return {
        lastMrrAmountCents: '0',
        mrrAmountCentsProgressionOnPeriod: '0',
      }
    }

    const localFirstMrrAmountCents = Number(formattedMrrData[0]?.endingMrr)
    const localLastMrrAmountCents: string =
      formattedMrrData[formattedMrrData?.length - 1]?.endingMrr

    // Bellow calcul should *100 but values are already in cents so no need to do it
    // Also explain why the toFixed is 4 and not 2
    const localLastMrrAmountCentsProgressionOnPeriod = new Decimal(
      Number(localLastMrrAmountCents || 0),
    )
      .sub(localFirstMrrAmountCents)
      .dividedBy(localFirstMrrAmountCents || 1)
      .toFixed(4)

    return {
      lastMrrAmountCents: localLastMrrAmountCents,
      mrrAmountCentsProgressionOnPeriod: localLastMrrAmountCentsProgressionOnPeriod,
    }
  }, [formattedMrrData])

  return {
    defaultCurrency,
    hasAccessToAnalyticsDashboardsFeature,
    lastMrrAmountCents,
    mrrAmountCentsProgressionOnPeriod,
    selectedCurrency,
    timeGranularity,
    data: formattedMrrData,
    hasError: !!mrrError && !mrrLoading,
    isLoading: mrrLoading,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
  }
}
