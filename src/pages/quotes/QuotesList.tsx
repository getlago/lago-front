import { useMemo, useState } from 'react'
import { generatePath } from 'react-router-dom'

import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Status } from '~/components/designSystem/Status'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

// TODO: Replace with real GraphQL query
import { ALL_QUOTES_FIXTURES } from './__tests__/fixtures'
import { getQuoteStatusMapping } from './common/getQuoteStatusMapping'
import { getQuoteTypeTranslationKey } from './common/getQuoteTypetranslationKey'
import { Quote } from './common/types'

const QuotesList = () => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  // TODO: Replace with real GraphQL lazy query
  const [isLoading] = useState(false)

  // Keep only the most recent version per quote number
  const data = useMemo(() => {
    const latestByNumber = new Map<string, Quote>()

    for (const quote of ALL_QUOTES_FIXTURES) {
      const existing = latestByNumber.get(quote.number)

      if (!existing || quote.version > existing.version) {
        latestByNumber.set(quote.number, quote)
      }
    }

    return Array.from(latestByNumber.values())
  }, [])

  const columns: Array<TableColumn<Quote>> = [
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
          // TODO: Implement pagination with real GraphQL query
        }}
      >
        <Table
          name="quotes-list"
          data={data}
          isLoading={isLoading}
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
