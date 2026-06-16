import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { downloadMarkdownPdf } from '~/components/designSystem/RichTextEditor/common/downloadMarkdownPdf'
import { useNavigate, VOID_ORDER_FORM_ROUTE } from '~/core/router'
import {
  type BillingItemsPayload,
  buildPreviewEntities,
} from '~/core/serializers/serializeQuoteBillingItems'
import { OrderFormListItemFragment, OrderFormStatusEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

export interface OrderFormAction {
  icon: IconName
  label: string
  onAction: () => void
}

export const useOrderFormActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()

  const getActions = (orderForm: OrderFormListItemFragment): OrderFormAction[] => {
    const actions: OrderFormAction[] = []

    // Download PDF — only when quote has content
    const content = orderForm.quote.currentVersion?.content

    if (content) {
      // Resolve pricing-block add-ons so they render in the printed PDF. Entities
      // are keyed by both localId and catalog addOnId so saved content blocks
      // resolve regardless of which reference they were persisted with.
      const billingItems = orderForm.quote.currentVersion?.billingItems as
        | BillingItemsPayload
        | null
        | undefined
      const entities = billingItems ? buildPreviewEntities(billingItems) : undefined

      actions.push({
        icon: 'download',
        label: translate('text_17797156485850t8yms6hf7z'),
        onAction: () => {
          downloadMarkdownPdf({ markdown: content, entities })
        },
      })
    }

    // Void — only for generated status, requires quotesVoid permission
    if (orderForm.status === OrderFormStatusEnum.Generated && hasPermissions(['quotesVoid'])) {
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
