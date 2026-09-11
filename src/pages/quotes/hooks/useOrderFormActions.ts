import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { SIGN_ORDER_FORM_ROUTE, VOID_ORDER_FORM_ROUTE } from '~/core/router'
import { OrderFormListItemFragment, OrderFormStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { buildOrderFormHeader } from '~/pages/quotes/common/buildOrderFormHeader'
import { buildQuotePreviewProps } from '~/pages/quotes/common/buildQuotePreviewProps'
import { useDownloadQuotePdf } from '~/pages/quotes/common/QuotePdfProvider'

export type OrderFormAction = {
  icon: IconName
  label: string
} & ({ onAction: () => void; link?: never } | { link: () => string; onAction?: never })

export const useOrderFormActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { download } = useDownloadQuotePdf()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const getActions = (orderForm: OrderFormListItemFragment): OrderFormAction[] => {
    const actions: OrderFormAction[] = []

    // Download PDF — only when quote has content
    const version = orderForm.quote.currentVersion
    const content = version?.content

    // Sign — only for generated status, requires orderFormsSign permission
    if (orderForm.status === OrderFormStatusEnum.Generated && hasPermissions(['orderFormsSign'])) {
      actions.push({
        icon: 'writing-sign',
        label: translate('text_1781686594125upfeikkemuy'),
        link: () => generatePath(SIGN_ORDER_FORM_ROUTE, { orderFormId: orderForm.id }),
      })
    }

    if (content) {
      const header = buildOrderFormHeader(
        orderForm,
        translate,
        (iso) => intlFormatDateTimeOrgaTZ(iso).date,
      )

      actions.push({
        icon: 'download',
        label: translate('text_17797156485850t8yms6hf7z'),
        onAction: () => {
          void download(
            buildQuotePreviewProps({
              version,
              customer: orderForm.customer,
              images: (orderForm.quote.images ?? {}) as Record<string, string>,
              header,
            }),
          ).catch(() => undefined)
        },
      })
    }

    // Void — only for generated status, requires orderFormsVoid permission
    if (orderForm.status === OrderFormStatusEnum.Generated && hasPermissions(['orderFormsVoid'])) {
      actions.push({
        icon: 'stop',
        label: translate('text_1779715648584xw9xgemkv9y'),
        link: () => generatePath(VOID_ORDER_FORM_ROUTE, { orderFormId: orderForm.id }),
      })
    }

    return actions
  }

  return { getActions }
}
