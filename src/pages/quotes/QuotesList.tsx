import { generatePath } from 'react-router-dom'

import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE } from '~/core/router'
import { QuoteListItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { createQuotesPaginationHandler } from './common/quotesPaginationHandler'
import {
  quoteCreatedAtColumn,
  quoteOrderTypeColumn,
  quoteStatusColumn,
} from './common/quoteTableColumns'
import { useQuotes } from './hooks/useQuotes'
import { useQuoteVersionActions } from './hooks/useQuoteVersionActions'

const QuotesList = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { quotes, loading, error, fetchMore, metadata } = useQuotes()
  const { getActions } = useQuoteVersionActions()

  const columns: Array<TableColumn<QuoteListItemFragment>> = [
    {
      key: 'number',
      title: translate('text_1775746196826pyjlfqx3anr'),
      minWidth: 160,
      maxSpace: true,
      content: ({ number }) => (
        <Typography variant="bodyHl" noWrap>
          {number}
        </Typography>
      ),
    },
    {
      key: 'customer.name',
      title: translate('text_65201c5a175a4b0238abf29a'),
      maxSpace: true,
      minWidth: 160,
      content: ({ customer }) => (
        <Typography color="grey600" noWrap>
          {customer.name}
        </Typography>
      ),
    },
    quoteStatusColumn(translate),
    {
      key: 'versions.0.version',
      title: translate('text_1775747115932pql5mtb30dc'),
      minWidth: 80,
      textAlign: 'right',
      content: ({ versions }) => (
        <Typography color="grey600">{versions[0]?.version ?? '-'}</Typography>
      ),
    },
    { ...quoteOrderTypeColumn(translate, 'text_1775747115932x8ryaymh8ej'), minWidth: 220 },
    quoteCreatedAtColumn(translate, 'text_624efab67eb2570101d117e3', intlFormatDateTimeOrgaTZ),
  ]

  return (
    <DetailsPage.Container>
      <InfiniteScroll onBottom={createQuotesPaginationHandler(metadata, loading, fetchMore)}>
        <Table
          name="quotes-list"
          data={quotes}
          isLoading={loading}
          hasError={!!error}
          onRowActionLink={({ id }) =>
            generatePath(QUOTE_DETAILS_ROUTE, {
              quoteId: id,
              tab: QuoteDetailsTabsOptionsEnum.overview,
            })
          }
          containerSize={0}
          columns={columns}
          actionColumnTooltip={() => translate('text_1776414006125pcxcyeblul7')}
          actionColumn={(quote) => {
            const actions = getActions(quote)

            if (actions.length === 0) return null

            return actions.map(({ icon, label, onAction }) => ({
              startIcon: icon,
              title: label,
              onAction: () => onAction(),
            }))
          }}
          placeholder={{
            emptyState: {
              title: translate('text_17757391860814p20fr87x9g'),
              subtitle: translate('text_177573918608169w9wthupaz'),
            },
          }}
        />
      </InfiniteScroll>
    </DetailsPage.Container>
  )
}

export default QuotesList
