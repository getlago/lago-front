import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { OrderListItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { createOrdersPaginationHandler } from './common/ordersPaginationHandler'
import {
  ordersExecutionDateColumn,
  ordersExecutionModeColumn,
  ordersNumberColumn,
  ordersOrderFormColumn,
  ordersSourceQuoteColumn,
  ordersStatusColumn,
} from './common/ordersTableColumns'
import { useOrders } from './hooks/useOrders'

interface OrdersListProps {
  quoteNumber?: string
}

const OrdersList = ({ quoteNumber }: OrdersListProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { orders, loading, error, fetchMore, metadata } = useOrders(
    quoteNumber ? { quoteNumber: [quoteNumber] } : undefined,
  )

  const columns: Array<TableColumn<OrderListItemFragment>> = [
    ordersNumberColumn(translate),
    ordersStatusColumn(translate),
    ...(quoteNumber ? [] : [ordersSourceQuoteColumn(translate)]),
    ordersOrderFormColumn(translate),
    ordersExecutionModeColumn(translate),
    ordersExecutionDateColumn(translate, intlFormatDateTimeOrgaTZ),
  ]

  return (
    <DetailsPage.Container>
      <InfiniteScroll onBottom={createOrdersPaginationHandler(metadata, loading, fetchMore)}>
        <Table
          name="orders-list"
          data={orders}
          isLoading={loading}
          hasError={!!error}
          containerSize={0}
          columns={columns}
          placeholder={{
            emptyState: {
              title: translate('text_1782392058759fvp6ye50x8g'),
              subtitle: translate('text_1782392058759ee7h86svmtj'),
            },
          }}
        />
      </InfiniteScroll>
    </DetailsPage.Container>
  )
}

export default OrdersList
