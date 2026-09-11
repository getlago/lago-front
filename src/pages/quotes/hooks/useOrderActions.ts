import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { EDIT_ORDER_ROUTE, EXECUTE_ORDER_ROUTE } from '~/core/router'
import { OrderListItemFragment, OrderStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { buildOrderHeader } from '~/pages/quotes/common/buildOrderHeader'
import { buildQuotePreviewProps } from '~/pages/quotes/common/buildQuotePreviewProps'
import { useDownloadQuotePdf } from '~/pages/quotes/common/QuotePdfProvider'

export type OrderAction = {
  icon: IconName
  label: string
} & ({ onAction: () => void; link?: never } | { link: () => string; onAction?: never })

export const useOrderActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { download } = useDownloadQuotePdf()

  const getActions = (order: OrderListItemFragment): OrderAction[] => {
    const actions: OrderAction[] = []

    // Execute manually — only for created (not yet executed) orders, requires ordersExecute
    if (order.status === OrderStatusEnum.Created && hasPermissions(['ordersExecute'])) {
      actions.push({
        icon: 'flash',
        label: translate('text_17836939541574skv5dmaj06'),
        link: () => generatePath(EXECUTE_ORDER_ROUTE, { orderId: order.id }),
      })
    }

    // Edit — only for created (not yet executed) orders, requires ordersUpdate permission
    if (order.status === OrderStatusEnum.Created && hasPermissions(['ordersUpdate'])) {
      actions.push({
        icon: 'pen',
        label: translate('text_17827235919844cwbnt9ltfe'),
        link: () => generatePath(EDIT_ORDER_ROUTE, { orderId: order.id }),
      })
    }

    // Download PDF — only when the quote version has content
    const version = order.orderForm.quote.currentVersion
    const content = version?.content

    if (content) {
      const header = buildOrderHeader(order, translate)

      actions.push({
        icon: 'download',
        label: translate('text_17797156485850t8yms6hf7z'),
        onAction: () => {
          void download(
            buildQuotePreviewProps({
              version,
              customer: order.customer,
              images: (order.orderForm.quote.images ?? {}) as Record<string, string>,
              header,
            }),
          ).catch(() => undefined)
        },
      })
    }

    return actions
  }

  return { getActions }
}
