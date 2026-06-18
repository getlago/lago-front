import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { useNavigate, VOID_ORDER_FORM_ROUTE } from '~/core/router'
import { OrderFormListItemFragment, OrderFormStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { intlFormatDateTime } from '~/core/timezone'
import {
  buildQuotePreviewProps,
  type QuotePdfHeaderData,
} from '~/pages/quotes/common/buildQuotePreviewProps'
import { useDownloadQuotePdf } from '~/pages/quotes/common/QuotePdfProvider'

export interface OrderFormAction {
  icon: IconName
  label: string
  onAction: () => void
}

export const useOrderFormActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()
  const { download } = useDownloadQuotePdf()

  const getActions = (orderForm: OrderFormListItemFragment): OrderFormAction[] => {
    const actions: OrderFormAction[] = []

    // Download PDF — only when quote has content
    const version = orderForm.quote.currentVersion
    const content = version?.content

    if (content) {
      const header: QuotePdfHeaderData = {
        documentNumber: orderForm.number,
        rows: [
          {
            label: translate('text_65201c5a175a4b0238abf29a'), // Customer
            value: orderForm.customer.name ?? '',
          },
          {
            label: translate('text_664cb90097bfa800e6efa3f5'), // Date
            value: intlFormatDateTime(orderForm.createdAt).date,
          },
        ],
      }

      actions.push({
        icon: 'download',
        label: translate('text_17797156485850t8yms6hf7z'),
        onAction: () => {
          void download(buildQuotePreviewProps(version, orderForm.customer, header)).catch(
            () => undefined,
          )
        },
      })
    }

    // Void — only for generated status, requires orderFormsVoid permission
    if (orderForm.status === OrderFormStatusEnum.Generated && hasPermissions(['orderFormsVoid'])) {
      actions.push({
        icon: 'stop',
        label: translate('text_1779715648584xw9xgemkv9y'),
        onAction: () =>
          navigate(generatePath(VOID_ORDER_FORM_ROUTE, { orderFormId: orderForm.id })),
      })
    }

    return actions
  }

  return { getActions }
}
