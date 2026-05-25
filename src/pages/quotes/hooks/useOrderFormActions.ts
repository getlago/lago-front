import { IconName } from 'lago-design-system'
import { generatePath } from 'react-router-dom'

import { downloadMarkdownPdf } from '~/components/designSystem/RichTextEditor/common/downloadMarkdownPdf'
import { useNavigate, VOID_ORDER_FORM_ROUTE } from '~/core/router'
import {
  OrderFormListItemFragment,
  OrderFormStatusEnum,
  useGetQuoteLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

export interface OrderFormAction {
  icon: IconName
  label: string
  onAction: () => void | Promise<void>
}

export const useOrderFormActions = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()
  const [getQuote, { loading: downloadLoading }] = useGetQuoteLazyQuery()

  const getActions = (orderForm: OrderFormListItemFragment): OrderFormAction[] => {
    const actions: OrderFormAction[] = []

    // Download PDF — always available
    actions.push({
      icon: 'download',
      label: translate('text_17797156485850t8yms6hf7z'),
      onAction: async () => {
        const result = await getQuote({ variables: { id: orderForm.quote.id } })
        const content = result.data?.quote?.currentVersion?.content

        if (content) {
          downloadMarkdownPdf({ markdown: content })
        }
      },
    })

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

  return { getActions, downloadLoading }
}
