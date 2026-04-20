import { Status } from '~/components/designSystem/Status'
import { TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { OrderFormListItemFragment } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { getOrderFormStatusMapping } from './getOrderFormStatusMapping'

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
