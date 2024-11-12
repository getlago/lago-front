import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import styled, { css } from 'styled-components'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  GetInvoicedUsagesQuery,
  useGetInvoicedUsagesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { palette, theme } from '~/styles'

import {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from './MonthSelectorDropdown'
import { TGraphProps } from './types'
import { getLastTwelveMonthsNumbersUntilNow } from './utils'

import { Skeleton, Typography } from '../designSystem'
import ChartHeader from '../designSystem/graphs/ChartHeader'
import { InvoicedUsageFakeData } from '../designSystem/graphs/fixtures'
import InlineBarsChart from '../designSystem/graphs/InlineBarsChart'
import { GenericPlaceholder } from '../GenericPlaceholder'
import { ChartWrapper } from '../layouts/Charts'

export const LAST_USAGE_GRAPH_LINE_KEY_NAME = 'Others'

const NUMBER_OF_BM_DISPLAYED = 5
const DOT_SIZE = 8

const GRAPH_COLORS = [
  theme.palette.primary[700],
  theme.palette.primary[400],
  theme.palette.primary[300],
  theme.palette.primary[200],
  theme.palette.grey[300],
]

gql`
  query getInvoicedUsages($currency: CurrencyEnum!) {
    invoicedUsages(currency: $currency) {
      collection {
        amountCents
        month
        currency
        code
      }
    }
  }
`
export type TGetInvoicedUsagesQuery = GetInvoicedUsagesQuery['invoicedUsages']['collection']

type TGetDataForUsageDisplay = {
  blur: boolean
  currency: CurrencyEnum
  data: TGetInvoicedUsagesQuery
  demoMode?: boolean
  period: TPeriodScopeTranslationLookupValue
}
type TReturnGetDataForUsageDisplay = {
  totalAmount: number
  dataBarForDisplay: Record<string, number>[]
  hasNoDataToDisplay: boolean
  dataLinesForDisplay: [string, number][]
  dateFrom: string
  dateTo: string
}

export function getDataForUsageDisplay({
  blur,
  currency,
  data,
  demoMode,
  period,
}: TGetDataForUsageDisplay): TReturnGetDataForUsageDisplay {
  const lastTwelveMonths = getLastTwelveMonthsNumbersUntilNow()

  const dataToExploit = demoMode || blur || !currency ? InvoicedUsageFakeData : data

  const filteredDataCollection = dataToExploit?.filter((item) => {
    const diffFromNow = Math.abs(DateTime.fromISO(item.month).diffNow('months').months)

    if (period === AnalyticsPeriodScopeEnum.Quarter && diffFromNow > 4) {
      return false
    } else if (period === AnalyticsPeriodScopeEnum.Month && diffFromNow > 2) {
      return false
    }

    return true
  })

  const hasNoData = !filteredDataCollection.length

  const to = lastTwelveMonths[lastTwelveMonths.length - 1]
  let from = lastTwelveMonths[0]

  if (period === AnalyticsPeriodScopeEnum.Quarter) {
    from = lastTwelveMonths[lastTwelveMonths.length - 4]
  } else if (period === AnalyticsPeriodScopeEnum.Month) {
    from = lastTwelveMonths[lastTwelveMonths.length - 2]
  }

  if (hasNoData) {
    return {
      totalAmount: 0,
      dataBarForDisplay: [{ '1': 1 }],
      hasNoDataToDisplay: true,
      dataLinesForDisplay: [],
      dateFrom: from,
      dateTo: to,
    }
  }

  const groupedDatasByCode = filteredDataCollection?.reduce<Record<string, number>>((acc, item) => {
    const code = item.code || ''

    if (acc[code]) {
      acc[code] = acc[code] + Number(item.amountCents)
    } else {
      acc[code] = Number(item.amountCents)
    }

    return acc
  }, {})

  const filteredGroupedDatasByCode = Object.entries(groupedDatasByCode).sort((a, b) =>
    Number(a[1]) > Number(b[1]) ? -1 : 1,
  )

  // If more than 5 BM, we group the rest of the BM in a single line
  if (filteredGroupedDatasByCode.length > NUMBER_OF_BM_DISPLAYED) {
    const lastLineAmount = filteredGroupedDatasByCode
      .slice(NUMBER_OF_BM_DISPLAYED - 1)
      .reduce((acc, item) => acc + Number(item[1]), 0)

    filteredGroupedDatasByCode.splice(NUMBER_OF_BM_DISPLAYED - 1)
    filteredGroupedDatasByCode.push([LAST_USAGE_GRAPH_LINE_KEY_NAME, lastLineAmount])
  }

  // should be an array of length 1 with all data as key: value
  const dataBar = filteredGroupedDatasByCode.reduce<Record<string, number>>(
    (acc, item) => ({
      ...acc,
      [item[0]]: Number(item[1]),
    }),
    {},
  )

  if (Object.values(dataBar).every((item) => item === 0)) {
    Object.keys(dataBar).forEach((key) => {
      dataBar[key] = 1
    })
  }

  const total = filteredGroupedDatasByCode.reduce((acc, item) => acc + Number(item[1]), 0)

  return {
    totalAmount: total,
    dataBarForDisplay: [dataBar],
    hasNoDataToDisplay: hasNoData,
    dataLinesForDisplay: filteredGroupedDatasByCode,
    dateFrom: from,
    dateTo: to,
  }
}

const Usage = ({
  demoMode,
  period,
  currency = CurrencyEnum.Usd,
  className,
  blur = false,
  forceLoading,
}: TGraphProps) => {
  const { translate } = useInternationalization()
  const [hoveredBarId, setHoveredBarId] = useState<string | undefined>(undefined)
  const { data, loading, error } = useGetInvoicedUsagesQuery({
    variables: {
      currency,
    },
    skip: demoMode || blur || !currency,
  })
  const isLoading = forceLoading || loading

  const {
    totalAmount,
    dataBarForDisplay,
    hasNoDataToDisplay,
    dataLinesForDisplay,
    dateFrom,
    dateTo,
  } = useMemo(
    () =>
      getDataForUsageDisplay({
        blur,
        currency,
        data: data?.invoicedUsages.collection || [],
        demoMode,
        period,
      }),
    [blur, currency, data, demoMode, period],
  )

  return (
    <Wrapper className={className}>
      {!!error ? (
        <Error
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : (
        <>
          <ChartHeader
            name={translate('text_6553885df387fd0097fd7393')}
            tooltipText={translate('text_65562f85ed468200b9debb85')}
            amount={intlFormatNumber(deserializeAmount(totalAmount, currency), {
              currency,
            })}
            period={translate('text_633dae57ca9a923dd53c2097', {
              fromDate: dateFrom,
              toDate: dateTo,
            })}
            blur={blur}
            loading={isLoading}
          />

          <ChartWrapper blur={blur}>
            <GraphWrapper>
              {!!isLoading ? (
                <>
                  <Skeleton variant="text" width="100%" />

                  <div>
                    {[...Array(3)].map((_, index) => (
                      <SkeletonLine key={`usage-skeleton-${index}`}>
                        <Skeleton variant="circular" width={8} height={8} />
                        <Skeleton variant="text" width="32%" />
                        <Skeleton variant="text" width="32%" />
                      </SkeletonLine>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <InlineBarsChart
                    data={dataBarForDisplay}
                    colors={
                      hasNoDataToDisplay ? [GRAPH_COLORS[GRAPH_COLORS.length - 1]] : GRAPH_COLORS
                    }
                    hoveredBarId={hoveredBarId}
                  />
                  <div>
                    {hasNoDataToDisplay ? (
                      <BMItem $disableHover>
                        <svg height={DOT_SIZE} width={DOT_SIZE}>
                          <circle
                            cx="4"
                            cy="4"
                            r="4"
                            fill={GRAPH_COLORS[NUMBER_OF_BM_DISPLAYED - 1]}
                          />
                        </svg>
                        <Typography variant="caption" color="grey700">
                          {translate('text_655633c844bc8a00577061b9')}
                        </Typography>
                        <Typography variant="caption" color="grey600">
                          {intlFormatNumber(0, { currency })}
                        </Typography>
                      </BMItem>
                    ) : (
                      <>
                        {dataLinesForDisplay.map((item, index) => (
                          <BMItem
                            key={`usage-item-${index}`}
                            onMouseEnter={() => setHoveredBarId(item[0])}
                            onMouseLeave={() => setHoveredBarId(undefined)}
                          >
                            <svg height={DOT_SIZE} width={DOT_SIZE}>
                              <circle
                                cx="4"
                                cy="4"
                                r="4"
                                fill={
                                  hasNoDataToDisplay
                                    ? GRAPH_COLORS[GRAPH_COLORS.length - 1]
                                    : GRAPH_COLORS[index]
                                }
                              />
                            </svg>
                            <Typography variant="caption" color="grey700">
                              {item[0] === LAST_USAGE_GRAPH_LINE_KEY_NAME
                                ? translate('text_6553885df387fd0097fd739e')
                                : item[0]}
                            </Typography>
                            <Typography variant="caption" color="grey600">
                              {intlFormatNumber(deserializeAmount(item[1], currency), { currency })}
                            </Typography>
                          </BMItem>
                        ))}
                      </>
                    )}
                  </div>
                </>
              )}
            </GraphWrapper>
          </ChartWrapper>
        </>
      )}
    </Wrapper>
  )
}

export default Usage

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(6)};
  padding: ${theme.spacing(6)} 0;
  box-sizing: border-box;
  background-color: ${theme.palette.common.white};
`

const GraphWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`

const BMItem = styled.div<{ $disableHover?: boolean }>`
  display: flex;
  align-items: center;
  height: 40px;
  gap: ${theme.spacing(2)};

  ${({ $disableHover }) =>
    !$disableHover &&
    css`
      &:hover {
        background-color: ${palette.grey[100]};
      }
    `}

  &:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }

  > *:last-child {
    margin-left: auto;
  }
`

const SkeletonLine = styled.div`
  display: flex;
  align-items: center;
  height: 40px;
  gap: ${theme.spacing(2)};

  &:not(:last-child) {
    box-shadow: ${theme.shadows[7]};
  }

  > *:last-child {
    margin-left: auto;
  }
`

const Error = styled(GenericPlaceholder)`
  margin: 0;
  padding: 0;
`
