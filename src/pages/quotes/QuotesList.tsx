import { generatePath } from 'react-router-dom'

import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Status } from '~/components/designSystem/Status'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE } from '~/core/router'
import { QuoteListItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { getQuoteStatusMapping } from './common/getQuoteStatusMapping'
import { getQuoteTypeTranslationKey } from './common/getQuoteTypetranslationKey'
import { useQuotes } from './useQuotes'

const QuotesList = () => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { quotes, loading, error, fetchMore, metadata } = useQuotes({ latestVersionOnly: true })

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
    {
      key: 'status',
      title: translate('text_63ac86d797f728a87b2f9fa7'),
      minWidth: 100,
      content: ({ status }) => <Status {...getQuoteStatusMapping(status, translate)} />,
    },
    {
      key: 'version',
      title: translate('text_1775747115932pql5mtb30dc'),
      minWidth: 80,
      textAlign: 'right',
      content: ({ version }) => <Typography color="grey600">{version}</Typography>,
    },
    {
      key: 'orderType',
      title: translate('text_1775747115932x8ryaymh8ej'),
      minWidth: 220,
      content: ({ orderType }) => (
        <Typography color="grey600">{translate(getQuoteTypeTranslationKey(orderType))}</Typography>
      ),
    },
    {
      key: 'createdAt',
      title: translate('text_624efab67eb2570101d117e3'),
      minWidth: 120,
      content: ({ createdAt }) => (
        <Typography color="grey600">{intlFormatDateTimeOrgaTZ(createdAt).date}</Typography>
      ),
    },
  ]

  return (
    <DetailsPage.Container>
      <InfiniteScroll
        onBottom={() => {
          const { currentPage = 0, totalPages = 0 } = metadata || {}

          currentPage < totalPages &&
            !loading &&
            fetchMore?.({
              variables: { page: currentPage + 1 },
            })
        }}
      >
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
