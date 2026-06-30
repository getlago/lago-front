import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { EDIT_ORDER_ROUTE, useNavigate } from '~/core/router'
import { OrderListItemFragment, OrderStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

export interface OrderAction {
  icon: IconName
  label: string
  onAction: () => void
}

export const useOrderActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()

  const getActions = (order: OrderListItemFragment): OrderAction[] => {
    const actions: OrderAction[] = []

    // Edit — only for created (not yet executed) orders, requires ordersUpdate permission
    if (order.status === OrderStatusEnum.Created && hasPermissions(['ordersUpdate'])) {
      actions.push({
        icon: 'pen',
        label: translate('text_17827235919844cwbnt9ltfe'),
        onAction: () => navigate(generatePath(EDIT_ORDER_ROUTE, { orderId: order.id })),
      })
    }

    return actions
  }

  return { getActions }
}
