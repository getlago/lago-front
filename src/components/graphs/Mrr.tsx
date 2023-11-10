import { gql } from '@apollo/client'
import { useMemo } from 'react'
import styled from 'styled-components'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, GetMrrQuery, useGetMrrQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'

import {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from './MonthSelectorDropdown'
import { TGraphProps } from './types'
import { formatDataForAreaChart, TAreaChartDataResult } from './utils'

import AreaChart from '../designSystem/graphs/AreaChart'
import ChartHeader from '../designSystem/graphs/ChartHeader'
import { AreaMrrChartFakeData } from '../designSystem/graphs/fixtures'
import { GenericPlaceholder } from '../GenericPlaceholder'

gql`
  query getMrr($currency: CurrencyEnum!) {
    mrrs(currency: $currency) {
      collection {
        amountCents
        currency
        month
      }
    }
  }
`

export function getAllDataForMrrDisplay({
  data,
  currency,
  demoMode,
  blur,
  period,
}: {
  data?: GetMrrQuery['mrrs']['collection']
  currency: CurrencyEnum
  demoMode: boolean
  blur: boolean
  period: TPeriodScopeTranslationLookupValue
}) {
  const formatedData = formatDataForAreaChart(
    demoMode || blur || !data ? AreaMrrChartFakeData : (data as TAreaChartDataResult),
    currency
  )

  if (period === AnalyticsPeriodScopeEnum.Quarter) {
    formatedData.splice(0, 8)
  } else if (period === AnalyticsPeriodScopeEnum.Month) {
    formatedData.splice(0, 10)
  }

  const sum = formatedData.reduce((acc, curr) => acc + Number(curr.value), 0)
  const [dateFrom, dateTo] = [
    formatedData[0].axisName,
    formatedData[formatedData.length - 1].axisName,
  ]

  return {
    dataForAreaChart: formatedData,
    amountSum: sum,
    dateFrom,
    dateTo,
  }
}

const Mrr = ({
  blur = false,
  className,
  currency = CurrencyEnum.Usd,
  demoMode = false,
  period,
}: TGraphProps) => {
  const { translate } = useInternationalization()
  const { data, loading, error } = useGetMrrQuery({
    variables: { currency: currency },
    skip: demoMode || blur || !currency,
  })

  const { dataForAreaChart, amountSum, dateFrom, dateTo } = useMemo(() => {
    return getAllDataForMrrDisplay({
      data: data?.mrrs?.collection,
      currency,
      demoMode,
      blur,
      period,
    })
  }, [data, currency, demoMode, blur, period])

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
            name={translate('text_6553885df387fd0097fd738c')}
            tooltipText={translate('text_655b21068fc7f80067fd6315')}
            amount={intlFormatNumber(deserializeAmount(amountSum, currency), {
              currency: currency,
            })}
            period={translate('text_633dae57ca9a923dd53c2097', {
              fromDate: dateFrom,
              toDate: dateTo,
            })}
            loading={loading}
            blur={blur}
          />
          <AreaChart
            loading={loading}
            blur={blur}
            data={dataForAreaChart}
            hasOnlyZeroValues={amountSum === 0}
            currency={currency}
          />
        </>
      )}
    </Wrapper>
  )
}

export default Mrr

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(6)};
  padding: ${theme.spacing(6)} 0;
  box-sizing: border-box;
  background-color: ${theme.palette.common.white};
`

const Error = styled(GenericPlaceholder)`
  margin: 0;
  padding: 0;
`
