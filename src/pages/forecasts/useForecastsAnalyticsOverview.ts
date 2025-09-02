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
  PremiumIntegrationTypeEnum,
  TimeGranularityEnum,
  TimezoneEnum,
  useGetForecastsQuery,
} from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { formatForecastsData } from '~/pages/forecasts/utils'

const MOCKS = [
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2022-12-01',
    endOfPeriodDt: '2022-12-31',
    amountCurrency: 'USD',
    optimistic: 49.43781470636082,
    realistic: 54.66769068951799,
    pessimistic: 34.88310297994967,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-01-01',
    endOfPeriodDt: '2023-01-31',
    amountCurrency: 'USD',
    optimistic: 84.43844954489617,
    realistic: 115.6874914657333,
    pessimistic: 63.08010005913469,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-02-01',
    endOfPeriodDt: '2023-02-28',
    amountCurrency: 'TZS',
    optimistic: 93.29507701638776,
    realistic: 140.60997419592422,
    pessimistic: 138.1085304247265,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-02-01',
    endOfPeriodDt: '2023-02-28',
    amountCurrency: 'USD',
    optimistic: 186.00632389310755,
    realistic: 223.68211174620083,
    pessimistic: 175.3101901207102,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-03-01',
    endOfPeriodDt: '2023-03-31',
    amountCurrency: 'TZS',
    optimistic: 249.85976846557676,
    realistic: 309.6228080585348,
    pessimistic: 226.8688394994273,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-03-01',
    endOfPeriodDt: '2023-03-31',
    amountCurrency: 'USD',
    optimistic: 294.56302767113044,
    realistic: 390.0071010834274,
    pessimistic: 248.77023875331264,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-04-01',
    endOfPeriodDt: '2023-04-30',
    amountCurrency: 'TZS',
    optimistic: 361.98331180706725,
    realistic: 403.63738053627407,
    pessimistic: 346.82161341478024,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-04-01',
    endOfPeriodDt: '2023-04-30',
    amountCurrency: 'USD',
    optimistic: 406.5544095603258,
    realistic: 453.37509580569304,
    pessimistic: 413.4205849375976,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-05-01',
    endOfPeriodDt: '2023-05-31',
    amountCurrency: 'TZS',
    optimistic: 446.4730194135196,
    realistic: 542.1751349067454,
    pessimistic: 420.2584844032024,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-05-01',
    endOfPeriodDt: '2023-05-31',
    amountCurrency: 'USD',
    optimistic: 481.6472063532606,
    realistic: 551.1588109238969,
    pessimistic: 480.45909026653754,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-06-01',
    endOfPeriodDt: '2023-06-30',
    amountCurrency: 'TZS',
    optimistic: 553.6583219756891,
    realistic: 612.8610951264089,
    pessimistic: 494.1090549421283,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-06-01',
    endOfPeriodDt: '2023-06-30',
    amountCurrency: 'USD',
    optimistic: 633.8004557600158,
    realistic: 622.0397928472396,
    pessimistic: 519.2202963068725,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-07-01',
    endOfPeriodDt: '2023-07-31',
    amountCurrency: 'EUR',
    optimistic: 704.0462211373172,
    realistic: 662.9614166364792,
    pessimistic: 584.0342141345458,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-07-01',
    endOfPeriodDt: '2023-07-31',
    amountCurrency: 'INR',
    optimistic: 718.1142752275243,
    realistic: 751.5943505734338,
    pessimistic: 618.4459976039557,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-07-01',
    endOfPeriodDt: '2023-07-31',
    amountCurrency: 'USD',
    optimistic: 732.2062511645375,
    realistic: 812.5544630865727,
    pessimistic: 665.4518149112466,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-08-01',
    endOfPeriodDt: '2023-08-31',
    amountCurrency: 'INR',
    optimistic: 760.9499077870764,
    realistic: 830.8817483970453,
    pessimistic: 680.3967647152056,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-08-01',
    endOfPeriodDt: '2023-08-31',
    amountCurrency: 'USD',
    optimistic: 791.893769745869,
    realistic: 834.827896130543,
    pessimistic: 745.4345377827563,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-09-01',
    endOfPeriodDt: '2023-09-30',
    amountCurrency: 'USD',
    optimistic: 826.4855751647746,
    realistic: 849.1831843114065,
    pessimistic: 787.9200141120876,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-10-01',
    endOfPeriodDt: '2023-10-31',
    amountCurrency: 'USD',
    optimistic: 867.642190534197,
    realistic: 871.7145296207023,
    pessimistic: 788.0235749795354,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-11-01',
    endOfPeriodDt: '2023-11-30',
    amountCurrency: 'EUR',
    optimistic: 883.7881478290898,
    realistic: 956.1531747733767,
    pessimistic: 846.9379193500206,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-11-01',
    endOfPeriodDt: '2023-11-30',
    amountCurrency: 'USD',
    optimistic: 909.3427936154432,
    realistic: 1041.7487592782372,
    pessimistic: 866.3832751314138,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-12-01',
    endOfPeriodDt: '2023-12-31',
    amountCurrency: 'EUR',
    optimistic: 989.4977389403557,
    realistic: 1132.5420956756664,
    pessimistic: 933.9272292406766,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2023-12-01',
    endOfPeriodDt: '2023-12-31',
    amountCurrency: 'USD',
    optimistic: 1015.4225053230778,
    realistic: 1212.2796651880283,
    pessimistic: 942.031966099392,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-01-01',
    endOfPeriodDt: '2024-01-31',
    amountCurrency: 'EUR',
    optimistic: 1055.1825792184663,
    realistic: 1228.844265128007,
    pessimistic: 948.2227816891891,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-01-01',
    endOfPeriodDt: '2024-01-31',
    amountCurrency: 'USD',
    optimistic: 1063.2103377237963,
    realistic: 1241.5561147444323,
    pessimistic: 976.1838266142439,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-02-01',
    endOfPeriodDt: '2024-02-29',
    amountCurrency: 'USD',
    optimistic: 1065.7724240809891,
    realistic: 1333.8918118905228,
    pessimistic: 1059.1812469788163,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-03-01',
    endOfPeriodDt: '2024-03-31',
    amountCurrency: 'USD',
    optimistic: 1143.1386568639653,
    realistic: 1398.4161968207134,
    pessimistic: 1082.0928712879058,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-04-01',
    endOfPeriodDt: '2024-04-30',
    amountCurrency: 'INR',
    optimistic: 1203.0745726553635,
    realistic: 1488.3669761598924,
    pessimistic: 1096.4403692007427,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-04-01',
    endOfPeriodDt: '2024-04-30',
    amountCurrency: 'USD',
    optimistic: 1235.5204632026134,
    realistic: 1503.4893458839867,
    pessimistic: 1148.6067350420421,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-05-01',
    endOfPeriodDt: '2024-05-31',
    amountCurrency: 'INR',
    optimistic: 1305.2646098977232,
    realistic: 1566.278650053866,
    pessimistic: 1219.7224271984358,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-05-01',
    endOfPeriodDt: '2024-05-31',
    amountCurrency: 'USD',
    optimistic: 1404.6729015883147,
    realistic: 1594.8883074025493,
    pessimistic: 1281.0726198082114,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-06-01',
    endOfPeriodDt: '2024-06-30',
    amountCurrency: 'INR',
    optimistic: 1480.8134971345244,
    realistic: 1679.1317066937206,
    pessimistic: 1341.6740277674617,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-06-01',
    endOfPeriodDt: '2024-06-30',
    amountCurrency: 'USD',
    optimistic: 1512.9352999400487,
    realistic: 1757.4416242080083,
    pessimistic: 1384.336433337383,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-07-01',
    endOfPeriodDt: '2024-07-31',
    amountCurrency: 'USD',
    optimistic: 1515.459516563056,
    realistic: 1847.1061020069108,
    pessimistic: 1436.906900286372,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-08-01',
    endOfPeriodDt: '2024-08-31',
    amountCurrency: 'USD',
    optimistic: 1570.3171632110814,
    realistic: 1859.1467537904289,
    pessimistic: 1508.1597844822015,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-09-01',
    endOfPeriodDt: '2024-09-30',
    amountCurrency: 'USD',
    optimistic: 1609.4490406237414,
    realistic: 1864.5650290688811,
    pessimistic: 1535.201996669898,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-10-01',
    endOfPeriodDt: '2024-10-31',
    amountCurrency: 'USD',
    optimistic: 1703.455706806245,
    realistic: 1933.4228779846474,
    pessimistic: 1603.4497790318396,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-11-01',
    endOfPeriodDt: '2024-11-30',
    amountCurrency: 'USD',
    optimistic: 1755.628958994658,
    realistic: 1943.189339784898,
    pessimistic: 1646.9674480925005,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2024-12-01',
    endOfPeriodDt: '2024-12-31',
    amountCurrency: 'USD',
    optimistic: 1770.2686412567255,
    realistic: 2017.8013368822112,
    pessimistic: 1742.927927314016,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-01-01',
    endOfPeriodDt: '2025-01-31',
    amountCurrency: 'USD',
    optimistic: 1836.7924182466957,
    realistic: 2113.424337369132,
    pessimistic: 1771.1757735504311,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-02-01',
    endOfPeriodDt: '2025-02-28',
    amountCurrency: 'BRL',
    optimistic: 1899.6457678282966,
    realistic: 2144.6291886822646,
    pessimistic: 1871.016355739138,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-02-01',
    endOfPeriodDt: '2025-02-28',
    amountCurrency: 'USD',
    optimistic: 1977.0549096357765,
    realistic: 2188.3802649997506,
    pessimistic: 1872.7320599001569,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-03-01',
    endOfPeriodDt: '2025-03-31',
    amountCurrency: 'USD',
    optimistic: 1989.937825735057,
    realistic: 2206.794870209789,
    pessimistic: 1938.224268596215,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-04-01',
    endOfPeriodDt: '2025-04-30',
    amountCurrency: 'USD',
    optimistic: 2016.8361239760186,
    realistic: 2250.920827415291,
    pessimistic: 2033.1441262970889,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-05-01',
    endOfPeriodDt: '2025-05-31',
    amountCurrency: 'USD',
    optimistic: 2057.0220629801697,
    realistic: 2277.458065101615,
    pessimistic: 2107.8346184794414,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-06-01',
    endOfPeriodDt: '2025-06-30',
    amountCurrency: 'USD',
    optimistic: 2078.171373961717,
    realistic: 2361.326120130258,
    pessimistic: 2153.853976916354,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-07-01',
    endOfPeriodDt: '2025-07-31',
    amountCurrency: 'ANG',
    optimistic: 2166.517679513473,
    realistic: 2425.53920770432,
    pessimistic: 2251.020726703167,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-07-01',
    endOfPeriodDt: '2025-07-31',
    amountCurrency: 'USD',
    optimistic: 2243.526863891342,
    realistic: 2482.6009357726152,
    pessimistic: 2311.618132103652,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-08-01',
    endOfPeriodDt: '2025-08-31',
    amountCurrency: 'USD',
    optimistic: 2261.989654740122,
    realistic: 2565.260220914376,
    pessimistic: 2315.939206209618,
  },
  {
    organizationId: 'c3a7f589-406e-4f8f-aa5c-4e0630012b86',
    startOfPeriodDt: '2025-09-01',
    endOfPeriodDt: '2025-09-30',
    amountCurrency: 'USD',
    optimistic: 2340.517690247167,
    realistic: 2566.2243230838135,
    pessimistic: 2325.1625822791857,
  },
]

gql`
  query getForecasts(
    $currency: CurrencyEnum
    $customerCountry: CountryCode
    $customerType: CustomerTypeEnum
    $isCustomerTinEmpty: Boolean
    $externalCustomerId: String
    $externalSubscriptionId: String
    $fromDate: ISO8601Date
    $planCode: String
    $timeGranularity: TimeGranularityEnum
    $toDate: ISO8601Date
    $billingEntityCode: String
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
      billingEntityCode: $billingEntityCode
      isCustomerTinEmpty: $isCustomerTinEmpty
    ) {
      collection {
        startOfPeriodDt
        endOfPeriodDt
      }
    }
  }
`

type ForecastsAnalyticsOverviewReturn = {
  selectedCurrency: CurrencyEnum
  defaultCurrency: CurrencyEnum
  data: any[]
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
    // eslint-disable-next-line
    const apiData = true ? MOCKS : forecastsData?.dataApiForecasts.collection

    return formatForecastsData({
      searchParams,
      data: apiData,
      defaultStaticDatePeriod: getDefaultStaticDateFilter(),
      defaultStaticTimeGranularity: getDefaultStaticTimeGranularityFilter(),
    })
  }, [
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    forecastsData?.dataApiForecasts.collection,
    searchParams,
  ])

  return {
    defaultCurrency,
    hasAccessToForecastsFeature,
    selectedCurrency,
    timeGranularity,
    data: formattedForecastsData,
    hasError: false && !!forecastsError && !forecastsLoading,
    isLoading: false && forecastsLoading,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
  }
}
