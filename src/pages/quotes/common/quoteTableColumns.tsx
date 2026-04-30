import { Status } from '~/components/designSystem/Status'
import { TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { QuoteListItemFragment } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { getQuoteOrderTypeTranslationKey } from './getQuoteOrderTypeTranslationKey'
import { getQuoteStatusMapping } from './getQuoteStatusMapping'

export const quoteStatusColumn = (
  translate: TranslateFunc,
): TableColumn<QuoteListItemFragment> => ({
  key: 'versions.0.status',
  title: translate('text_63ac86d797f728a87b2f9fa7'),
  minWidth: 100,
  content: ({ versions }) => {
    const status = versions[0]?.status

    if (!status) return null

    return <Status {...getQuoteStatusMapping(status, translate)} />
  },
})

export const quoteOrderTypeColumn = (
  translate: TranslateFunc,
  titleKey: string,
): TableColumn<QuoteListItemFragment> => ({
  key: 'orderType',
  title: translate(titleKey),
  content: ({ orderType }) => (
    <Typography color="grey600">{translate(getQuoteOrderTypeTranslationKey(orderType))}</Typography>
  ),
})

export const quoteCreatedAtColumn = (
  translate: TranslateFunc,
  titleKey: string,
  intlFormatDateTimeOrgaTZ: (date: string) => { date: string },
): TableColumn<QuoteListItemFragment> => ({
  key: 'createdAt',
  title: translate(titleKey),
  minWidth: 160,
  content: ({ createdAt }) => (
    <Typography color="grey600">{intlFormatDateTimeOrgaTZ(createdAt).date}</Typography>
  ),
})
