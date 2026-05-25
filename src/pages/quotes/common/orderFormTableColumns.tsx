import { generatePath } from 'react-router-dom'

import { Status } from '~/components/designSystem/Status'
import { TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { Link, QUOTE_DETAILS_ROUTE } from '~/core/router'
import { OrderFormListItemFragment } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { getOrderFormStatusMapping } from './getOrderFormStatusMapping'

export const orderFormSourceQuoteColumn = (
  translate: TranslateFunc,
): TableColumn<OrderFormListItemFragment> => ({
  key: 'quote.number',
  title: translate('text_1779695273381h7tmhdzrv48'),
  minWidth: 160,
  content: ({ quote }) => (
    <Typography color="info600" noWrap>
      <Link
        to={generatePath(QUOTE_DETAILS_ROUTE, {
          quoteId: quote.id,
          tab: QuoteDetailsTabsOptionsEnum.overview,
        })}
      >
        {quote.number} - v{quote.currentVersion.version}
      </Link>
    </Typography>
  ),
})

export const orderFormStatusColumn = (
  translate: TranslateFunc,
): TableColumn<OrderFormListItemFragment> => ({
  key: 'status',
  title: translate('text_63ac86d797f728a87b2f9fa7'),
  minWidth: 100,
  content: ({ status }) => <Status {...getOrderFormStatusMapping(status, translate)} />,
})

export const orderFormCreatedAtColumn = (
  translate: TranslateFunc,
  titleKey: string,
  intlFormatDateTimeOrgaTZ: (date: string) => { date: string },
): TableColumn<OrderFormListItemFragment> => ({
  key: 'createdAt',
  title: translate(titleKey),
  minWidth: 120,
  content: ({ createdAt }) => (
    <Typography color="grey600">{intlFormatDateTimeOrgaTZ(createdAt).date}</Typography>
  ),
})
