import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { useNavigate, VOID_ORDER_FORM_ROUTE, SIGN_ORDER_FORM_ROUTE } from '~/core/router'
import { OrderFormListItemFragment, OrderFormStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
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
        documentNumber: orderForm.number ?? '',
        title: translate('text_1781778938224v233vcwkqyt', {
          customerName: orderForm.customer.name ?? '',
        }),
        rows: [
          translate('text_1781778938224iupllzr5sgb', {
            orderFormNumber: orderForm.number ?? '',
          }),
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

    // Sign — only for generated status, requires orderFormsSign permission
    if (orderForm.status === OrderFormStatusEnum.Generated && hasPermissions(['orderFormsSign'])) {
      actions.push({
        icon: 'writing-sign',
        label: translate('text_1781686594125upfeikkemuy'),
        onAction: () =>
          navigate(generatePath(SIGN_ORDER_FORM_ROUTE, { orderFormId: orderForm.id })),
      })
    }

    return actions
  }

  return { getActions }
}
