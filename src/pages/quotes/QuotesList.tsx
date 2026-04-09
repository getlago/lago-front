import { Icon } from 'lago-design-system'
import { useMemo, useState } from 'react'

import { Avatar } from '~/components/designSystem/Avatar'
import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Status, StatusType } from '~/components/designSystem/Status'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

// TODO: Replace with real GraphQL query
import { ALL_QUOTES_FIXTURES } from './__tests__/fixtures'
import { Quote, QuoteOrderTypeEnum, QuoteStatusEnum } from './types'

const quoteStatusMapping = (status: QuoteStatusEnum, translate: (key: string) => string) => {
  switch (status) {
    case QuoteStatusEnum.draft:
      return { type: StatusType.outline, label: 'draft' as const }
    case QuoteStatusEnum.approved:
      return { type: StatusType.success, label: translate('text_1775747115932eu6r3ejjoox') }
    case QuoteStatusEnum.voided:
      return { type: StatusType.disabled, label: 'voided' as const }
  }
}

const quoteOrderTypeTranslationMap: Record<QuoteOrderTypeEnum, string> = {
  [QuoteOrderTypeEnum.subscriptionCreation]: 'text_1775747115932u8ttc3l11w1',
  [QuoteOrderTypeEnum.subscriptionAmendment]: 'text_17757471159329jnt7pyy6vr',
  [QuoteOrderTypeEnum.oneOff]: 'text_1775747115932ib2to4erkoo',
}

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
      content: ({ number }) => (
        <div className="flex items-center gap-3">
          <Avatar size="big" variant="connector">
            <Icon name="writing-sign" />
          </Avatar>
          <Typography variant="bodyHl" color="grey700" noWrap>
            {number}
          </Typography>
        </div>
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
      content: ({ status }) => <Status {...quoteStatusMapping(status, translate)} />,
    },
    {
      key: 'version',
      title: translate('text_1775747115932pql5mtb30dc'),
      minWidth: 80,
      textAlign: 'right',
      content: ({ version }) => <Typography color="grey600">v{version}</Typography>,
    },
    {
      key: 'orderType',
      title: translate('text_1775747115932x8ryaymh8ej'),
      minWidth: 220,
      content: ({ orderType }) => (
        <Typography color="grey600">
          {translate(quoteOrderTypeTranslationMap[orderType])}
        </Typography>
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
    <InfiniteScroll
      onBottom={() => {
        // TODO: Implement pagination with real GraphQL query
      }}
    >
      <Table
        name="quotes-list"
        data={data}
        isLoading={isLoading}
        rowSize={72}
        containerSize={{
          default: 16,
          md: 48,
        }}
        columns={columns}
        placeholder={{
          emptyState: {
            title: translate('text_17757391860814p20fr87x9g'),
            subtitle: translate('text_177573918608169w9wthupaz'),
          },
        }}
      />
    </InfiniteScroll>
  )
}

export default QuotesList
