import { Stack } from '@mui/material'
import { DateTime } from 'luxon'
import { FC } from 'react'
import styled from 'styled-components'

import { Icon, Tooltip, Typography } from '~/components/designSystem'
import {
  AnalyticsPeriodScopeEnum,
  TPeriodScopeTranslationLookupValue,
} from '~/components/graphs/MonthSelectorDropdown'
import { TGraphProps } from '~/components/graphs/types'
import { GRAPH_YEAR_MONTH_DATE_FORMAT } from '~/components/graphs/utils'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

const getDatesFromPeriod = (period: TPeriodScopeTranslationLookupValue) => {
  let from = DateTime.now()

  if (period === AnalyticsPeriodScopeEnum.Year) {
    from = DateTime.now().minus({ years: 1 })
  } else if (period === AnalyticsPeriodScopeEnum.Quarter) {
    from = DateTime.now().minus({ months: 3 })
  } else if (period === AnalyticsPeriodScopeEnum.Month) {
    from = DateTime.now().minus({ months: 1 })
  }

  return {
    from: from.toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
    to: DateTime.now().toFormat(GRAPH_YEAR_MONTH_DATE_FORMAT),
  }
}

const Overview: FC<TGraphProps> = ({ currency = CurrencyEnum.Usd, period }) => {
  const { translate } = useInternationalization()

  const { from, to } = getDatesFromPeriod(period)

  // TODO: Replace with real data
  const amount = 29707

  return (
    <GridItem>
      <Stack flexDirection="column" gap={2}>
        <Stack flexDirection="row" justifyContent="space-between" alignItems="center">
          <Stack flexDirection="row" gap={2} alignItems="center">
            <Typography variant="captionHl">{translate('Overdue invoices')}</Typography>
            <Tooltip
              title={translate(
                'TODO: Total amount associated with overdue invoices, which are pending or failed and past their due dates.',
              )}
            >
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
          {intlFormatNumber(amount, {
            currency,
          })}
          <Typography variant="caption" component="span" sx={{ marginLeft: theme.spacing(1) }}>
            {translate('totaling on 5 invoices')}
          </Typography>
        </Typography>
      </Stack>
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
