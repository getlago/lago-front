import { useMemo, useState } from 'react'
import { generatePath, useSearchParams } from 'react-router-dom'

import { formatFiltersForOrdersQuery } from '~/components/designSystem/Filters'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { EXECUTE_ORDER_ROUTE, ORDER_DETAILS_ROUTE } from '~/core/router'
import { OrderListItemFragment, OrderStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { QuotesSectionTable } from './common/QuotesSectionTable'
import { useOrdersColumns } from './common/useOrdersColumns'
import { useOrderActions } from './hooks/useOrderActions'
import { useOrders } from './hooks/useOrders'

interface OrdersListProps {
  quoteNumber?: string
}

const OrdersList = ({ quoteNumber }: OrdersListProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()

  const filtersForOrdersQuery = useMemo(
    () => formatFiltersForOrdersQuery(searchParams),
    [searchParams],
  )

  const defaultFilters = {
    ...filtersForOrdersQuery,
  }

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const { orders, loading, error, fetchMore, metadata } = useOrders(
    quoteNumber ? { ...defaultFilters, quoteNumber: [quoteNumber] } : defaultFilters,
    pageSize,
  )
  const { getActions } = useOrderActions()

  const columns = useOrdersColumns({ hideSourceQuote: !!quoteNumber })

  const getRowLink = (order: OrderListItemFragment): string =>
    order.status === OrderStatusEnum.Created
      ? generatePath(EXECUTE_ORDER_ROUTE, { orderId: order.id })
      : generatePath(ORDER_DETAILS_ROUTE, { orderId: order.id })

  return (
    <QuotesSectionTable
      name="orders-list"
      data={orders}
      isLoading={loading}
      hasError={!!error}
      metadata={metadata}
      fetchMore={fetchMore}
      columns={columns}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}
      emptyState={{
        title: translate('text_1782392058759fvp6ye50x8g'),
        subtitle: translate('text_1782392058759ee7h86svmtj'),
      }}
      getActions={(order) => getActions(order)}
      onRowActionLink={getRowLink}
    />
  )
}

export default OrdersList
