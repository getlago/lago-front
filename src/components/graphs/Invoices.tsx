import { gql } from '@apollo/client'
import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import styled, { css } from 'styled-components'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  GetInvoiceCollectionsQuery,
  InvoicePaymentStatusTypeEnum,
  useGetInvoiceCollectionsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { palette, theme } from '~/styles'

import {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from './MonthSelectorDropdown'
import { TGraphProps } from './types'
import { getLastTwelveMonthsNumbersUntilNow, GRAPH_YEAR_MONTH_DATE_FORMAT } from './utils'

import { Skeleton, Typography } from '../designSystem'
import ChartHeader from '../designSystem/graphs/ChartHeader'
import { InvoiceCollectionsFakeData } from '../designSystem/graphs/fixtures'
import InlineBarsChart from '../designSystem/graphs/InlineBarsChart'
import { GenericPlaceholder } from '../GenericPlaceholder'
import { ChartWrapper } from '../layouts/Charts'

const DOT_SIZE = 8

const GRAPH_COLORS = [
  theme.palette.success[400],
  theme.palette.secondary[400],
  theme.palette.grey[300],
]

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
`

export type TInvoiceCollectionsDataResult =
  GetInvoiceCollectionsQuery['invoiceCollections']['collection']

type TFormatInvoiceCollectionsDataReturn = Map<
  InvoicePaymentStatusTypeEnum,
  TInvoiceCollectionsDataResult
>

const LINE_DATA_ALL_KEY_NAME = 'all'

const lookupInvoiceLineTranslation = {
  [InvoicePaymentStatusTypeEnum.Succeeded]: 'text_6553885df387fd0097fd73a3',
  [InvoicePaymentStatusTypeEnum.Failed]: 'text_6553885df387fd0097fd73a5',
  [InvoicePaymentStatusTypeEnum.Pending]: 'text_6553885df387fd0097fd73a7',
}

export const fillInvoicesDataPerMonthForPaymentStatus = (
  data: TInvoiceCollectionsDataResult | undefined,
  paymentStatus: InvoicePaymentStatusTypeEnum,
  currency: CurrencyEnum,
): TInvoiceCollectionsDataResult => {
  const lastTwelveMonths = getLastTwelveMonthsNumbersUntilNow()
  const res = []

  for (const month of lastTwelveMonths) {
    const existingMonthData = data?.find(
      (d) =>
        d.paymentStatus === paymentStatus &&
        DateTime.fromISO(d.month).toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT) === month,
    )

    if (existingMonthData) {
      res.push({
        ...existingMonthData,
        month: DateTime.fromISO(existingMonthData.month).toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
      })
    } else {
      res.push({
        paymentStatus,
        invoicesCount: '0',
        amountCents: '0',
        currency,
        month,
      })
    }
  }

  return res
}

export const formatInvoiceCollectionsData = (
  data: TInvoiceCollectionsDataResult | undefined,
  currency: CurrencyEnum,
): TFormatInvoiceCollectionsDataReturn => {
  const res = new Map()

  res.set(
    InvoicePaymentStatusTypeEnum.Succeeded,
    fillInvoicesDataPerMonthForPaymentStatus(
      data,
      InvoicePaymentStatusTypeEnum.Succeeded,
      currency,
    ),
  )
  res.set(
    InvoicePaymentStatusTypeEnum.Failed,
    fillInvoicesDataPerMonthForPaymentStatus(data, InvoicePaymentStatusTypeEnum.Failed, currency),
  )
  res.set(
    InvoicePaymentStatusTypeEnum.Pending,
    fillInvoicesDataPerMonthForPaymentStatus(data, InvoicePaymentStatusTypeEnum.Pending, currency),
  )

  return res
}

export const extractDataForDisplay = (
  data: TFormatInvoiceCollectionsDataReturn,
): Map<
  InvoicePaymentStatusTypeEnum | typeof LINE_DATA_ALL_KEY_NAME,
  { invoicesCount: number; amountCents: number }
> => {
  const res = new Map()

  const getStatusDataReducer = (
    acc: Pick<TInvoiceCollectionsDataResult[0], 'invoicesCount' | 'amountCents'>,
    curr: { invoicesCount: string; amountCents: string },
  ) => {
    acc.amountCents += Number(curr.amountCents || 0)
    acc.invoicesCount += Number(curr.invoicesCount || 0)

    return acc
  }

  res.set(
    InvoicePaymentStatusTypeEnum.Succeeded,
    data
      .get(InvoicePaymentStatusTypeEnum.Succeeded)
      ?.reduce(getStatusDataReducer, { invoicesCount: 0, amountCents: 0 }),
  )
  res.set(
    InvoicePaymentStatusTypeEnum.Failed,
    data
      .get(InvoicePaymentStatusTypeEnum.Failed)
      ?.reduce(getStatusDataReducer, { invoicesCount: 0, amountCents: 0 }),
  )
  res.set(
    InvoicePaymentStatusTypeEnum.Pending,
    data
      .get(InvoicePaymentStatusTypeEnum.Pending)
      ?.reduce(getStatusDataReducer, { invoicesCount: 0, amountCents: 0 }),
  )
  res.set(LINE_DATA_ALL_KEY_NAME, {
    invoicesCount:
      res.get(InvoicePaymentStatusTypeEnum.Succeeded)?.invoicesCount +
      res.get(InvoicePaymentStatusTypeEnum.Failed)?.invoicesCount +
      res.get(InvoicePaymentStatusTypeEnum.Pending)?.invoicesCount,
    amountCents:
      res.get(InvoicePaymentStatusTypeEnum.Succeeded)?.amountCents +
      res.get(InvoicePaymentStatusTypeEnum.Failed)?.amountCents +
      res.get(InvoicePaymentStatusTypeEnum.Pending)?.amountCents,
  })

  return res
}

export const getAllDataForInvoicesDisplay = ({
  blur,
  currency,
  data,
  demoMode,
  period,
}: {
  blur: boolean
  currency: CurrencyEnum
  data: TInvoiceCollectionsDataResult | undefined
  demoMode: boolean
  period: TPeriodScopeTranslationLookupValue
}) => {
  const paddedData = formatInvoiceCollectionsData(
    demoMode || blur || !data ? InvoiceCollectionsFakeData : data,
    currency,
  )

  if (period === AnalyticsPeriodScopeEnum.Quarter) {
    paddedData.forEach((values, key) => {
      paddedData.set(
        key,
        values.filter((_, index) => index > 8),
      )
    })
  } else if (period === AnalyticsPeriodScopeEnum.Month) {
    paddedData.forEach((values, key) => {
      paddedData.set(
        key,
        values.filter((_, index) => index > 10),
      )
    })
  }

  const [from, to] = [
    paddedData.get(InvoicePaymentStatusTypeEnum.Succeeded)?.[0]?.month,
    paddedData.get(InvoicePaymentStatusTypeEnum.Succeeded)?.[
      (paddedData.get(InvoicePaymentStatusTypeEnum.Succeeded)?.length || 1) - 1
    ]?.month,
  ]
  const extractedData = extractDataForDisplay(paddedData)
  const hasOnlyZeroValues = extractedData.get(LINE_DATA_ALL_KEY_NAME)?.amountCents === 0
  const total =
    (extractedData.get(InvoicePaymentStatusTypeEnum.Failed)?.amountCents || 0) +
    (extractedData.get(InvoicePaymentStatusTypeEnum.Pending)?.amountCents || 0)

  const localBarGraphData = [
    {
      [InvoicePaymentStatusTypeEnum.Succeeded]: hasOnlyZeroValues
        ? 1
        : extractedData.get(InvoicePaymentStatusTypeEnum.Succeeded)?.amountCents || 0,
      [InvoicePaymentStatusTypeEnum.Failed]: hasOnlyZeroValues
        ? 1
        : extractedData.get(InvoicePaymentStatusTypeEnum.Failed)?.amountCents || 0,
      [InvoicePaymentStatusTypeEnum.Pending]: hasOnlyZeroValues
        ? 1
        : extractedData.get(InvoicePaymentStatusTypeEnum.Pending)?.amountCents || 0,
    },
  ]

  return {
    barGraphData: localBarGraphData,
    dateFrom: from,
    dateTo: to,
    lineData: extractedData,
    totalAmount: total,
  }
}

const Invoices = ({
  demoMode = false,
  currency = CurrencyEnum.Usd,
  period,
  className,
  blur = false,
  forceLoading,
}: TGraphProps) => {
  const { translate } = useInternationalization()
  const [hoveredBarId, setHoveredBarId] = useState<string | undefined>(undefined)
  const { data, loading, error } = useGetInvoiceCollectionsQuery({
    variables: {
      currency,
    },
    skip: demoMode || blur || !currency,
  })
  const isLoading = forceLoading || loading

  const { barGraphData, dateFrom, dateTo, lineData, totalAmount } = useMemo(() => {
    return getAllDataForInvoicesDisplay({
      data: data?.invoiceCollections.collection,
      currency,
      demoMode,
      blur,
      period,
    })
  }, [blur, currency, data?.invoiceCollections.collection, demoMode, period])

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
            name={translate('text_6553885df387fd0097fd73a0')}
            tooltipText={translate('text_65562f85ed468200b9debb88')}
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
                      <SkeletonLine key={`invoices-skeleton-${index}`}>
                        <Skeleton variant="circular" size="tiny" />
                        <Skeleton variant="text" width="32%" />
                        <Skeleton variant="text" width="32%" />
                      </SkeletonLine>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <InlineBarsChart
                    data={barGraphData}
                    colors={GRAPH_COLORS}
                    hoveredBarId={hoveredBarId}
                  />
                  <div>
                    {[
                      InvoicePaymentStatusTypeEnum.Succeeded,
                      InvoicePaymentStatusTypeEnum.Failed,
                      InvoicePaymentStatusTypeEnum.Pending,
                    ].map((status, index) => (
                      <InvoiceItem
                        key={`invoices-item-${status}-${index}`}
                        onMouseEnter={() => setHoveredBarId(status)}
                        onMouseLeave={() => setHoveredBarId(undefined)}
                      >
                        <svg height={DOT_SIZE} width={DOT_SIZE}>
                          <circle cx="4" cy="4" r="4" fill={GRAPH_COLORS[index]} />
                        </svg>
                        <Typography variant="caption" color="grey700">
                          {translate(lookupInvoiceLineTranslation[status], {
                            count: lineData.get(status)?.invoicesCount,
                          })}
                        </Typography>
                        <Typography variant="caption" color="grey600">
                          {intlFormatNumber(
                            deserializeAmount(lineData.get(status)?.amountCents || 0, currency),
                            { currency },
                          )}
                        </Typography>
                      </InvoiceItem>
                    ))}

                    <InvoiceItem $disableHover>
                      <svg height={DOT_SIZE} width={DOT_SIZE}></svg>
                      <Typography variant="caption" color="grey700">
                        {translate('text_6553885df387fd0097fd73a9', {
                          count: lineData.get(LINE_DATA_ALL_KEY_NAME)?.invoicesCount,
                        })}
                      </Typography>
                      <Typography variant="caption" color="grey600">
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
                    </InvoiceItem>
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

export default Invoices

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

const InvoiceItem = styled.div<{ $disableHover?: boolean }>`
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
