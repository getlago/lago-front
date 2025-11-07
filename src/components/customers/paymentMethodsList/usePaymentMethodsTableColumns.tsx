import { useMemo } from 'react'

import { ActionItem } from '~/components/designSystem/Table'
import { TableColumn } from '~/components/designSystem/Table'
import {
  DestroyPaymentMethodInput,
  PaymentMethodsQuery,
  SetAsDefaultInput,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { generatePaymentMethodsActions } from './actions'
import { PaymentMethodDetailsCell } from './PaymentMethodDetailsCell'
import { PaymentMethodStatusCell } from './PaymentMethodStatusCell'

type PaymentMethodItem = PaymentMethodsQuery['paymentMethods']['collection'][number]

interface UsePaymentMethodsTableColumnsParams {
  setPaymentMethodAsDefault: (input: SetAsDefaultInput) => Promise<void>
  destroyPaymentMethod: (input: DestroyPaymentMethodInput) => Promise<void>
}

interface UsePaymentMethodsTableColumnsReturn {
  columns: Array<TableColumn<PaymentMethodItem> | null>
  actionColumn: (item: PaymentMethodItem) => Array<ActionItem<PaymentMethodItem> | null>
}

export const usePaymentMethodsTableColumns = ({
  setPaymentMethodAsDefault,
  destroyPaymentMethod,
}: UsePaymentMethodsTableColumnsParams): UsePaymentMethodsTableColumnsReturn => {
  const { translate } = useInternationalization()

  return useMemo(
    () => ({
      columns: [
        {
          key: 'id',
          title: translate('text_1762437511802dynl0tx20xe'),
          maxSpace: true,
          content: (item: PaymentMethodItem) => <PaymentMethodDetailsCell item={item} />,
        },
        {
          key: 'id',
          title: translate('text_63ac86d797f728a87b2f9fa7'),
          content: (item: PaymentMethodItem) => <PaymentMethodStatusCell item={item} />,
        },
      ],
      actionColumn: () =>
        generatePaymentMethodsActions({
          translate,
          setPaymentMethodAsDefault,
          destroyPaymentMethod,
        }),
    }),
    [translate, setPaymentMethodAsDefault, destroyPaymentMethod],
  )
}
