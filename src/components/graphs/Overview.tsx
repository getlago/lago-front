import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { DateTime } from 'luxon'
import { FC } from 'react'
import styled from 'styled-components'

import { Icon, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import { TGraphProps } from '~/components/graphs/types'
import { GRAPH_YEAR_MONTH_DATE_FORMAT } from '~/components/graphs/utils'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, useGetOverdueQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { theme } from '~/styles'

gql`
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

const getDatesFromPeriod = (period: TPeriodScopeTranslationLookupValue) => {
  let from = DateTime.now()
  let month = 12

  if (period === AnalyticsPeriodScopeEnum.Year) {
    from = DateTime.now().minus({ years: 1 })
  } else if (period === AnalyticsPeriodScopeEnum.Quarter) {
    from = DateTime.now().minus({ months: 3 })
    month = from.month
  } else if (period === AnalyticsPeriodScopeEnum.Month) {
    from = DateTime.now().minus({ months: 1 })
    month = from.month
  }

  return {
    from: from.toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
    to: DateTime.now().toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
    month,
  }
}

const Overview: FC<TGraphProps & { externalCustomerId?: string }> = ({
  currency = CurrencyEnum.Usd,
  period,
  externalCustomerId,
}) => {
  const { translate } = useInternationalization()
  const { from, to, month } = getDatesFromPeriod(period)
  const { data, loading, error } = useGetOverdueQuery({
    variables: { currency: currency, externalCustomerId: externalCustomerId, months: 12 },
    skip: !currency,
  })

  const overdueData = data?.overdueBalances.collection.reduce<{
    amountCents: number
    invoiceCount: number
  }>(
    (acc, item) => {
      const itemMonth = DateTime.fromISO(item.month as string).month

      // If the period is month and the item month is different from the period month, we should not count it
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

  return (
    <GridItem>
      {!!error ? (
        <GenericPlaceholder
          title={translate('text_636d023ce11a9d038819b579')}
          subtitle={translate('text_636d023ce11a9d038819b57b')}
          image={<ErrorImage width="136" height="104" />}
        />
      ) : !!loading ? (
        <Stack flexDirection="column" gap={5} height={56}>
          <Skeleton variant="text" width={100} />
          <Skeleton variant="text" width={300} />
        </Stack>
      ) : (
        <Stack flexDirection="column" gap={2}>
          <Stack flexDirection="row" justifyContent="space-between" alignItems="center">
            <Stack flexDirection="row" gap={2} alignItems="center">
              <Typography variant="captionHl">
                {translate('text_6670a6577ecbf200898af647')}
              </Typography>
              <Tooltip title={translate('text_6670a6577ecbf200898af646')} placement="top-start">
                <Icon name="info-circle" />
              </Tooltip>
            </Stack>
            <Typography variant="note" color="grey600">
              {translate('text_633dae57ca9a923dd53c2097', {
                fromDate: from,
                toDate: to,
              })}
            </Typography>
          </Stack>
          <Typography variant="subhead">
            {intlFormatNumber(overdueData?.amountCents || 0, {
              currency,
            })}
            <Typography variant="caption" component="span" sx={{ marginLeft: theme.spacing(1) }}>
              {translate(
                'text_6670a6577ecbf200898af64a',
                { count: overdueData?.invoiceCount },
                overdueData?.invoiceCount,
              )}
            </Typography>
          </Typography>
        </Stack>
      )}
    </GridItem>
  )
}

export default Overview

const GridItem = styled.div`
  grid-column: span 1;
  background-color: ${theme.palette.common.white};
  padding-bottom: ${theme.spacing(6)};

  ${theme.breakpoints.up('lg')} {
    grid-column: span 2;
  }
`
