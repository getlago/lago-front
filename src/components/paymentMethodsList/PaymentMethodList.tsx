import { gql } from '@apollo/client'
import { useCallback } from 'react'

import { Table } from '~/components/designSystem/Table'
import { addToast } from '~/core/apolloClient'
import {
  DestroyPaymentMethodInput,
  SetAsDefaultInput,
  useDestroyPaymentMethodMutation,
  useSetPaymentMethodAsDefaultMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useConnectionPaymentMethodsList } from '~/hooks/customer/useConnectionPaymentMethodsList'
import { PaymentMethodItem } from '~/hooks/customer/usePaymentMethodsList'

import { useDeletePaymentMethodDialog } from './DeletePaymentMethodDialog'
import { usePaymentMethodsTableColumns } from './usePaymentMethodsTableColumns'

gql`
  mutation setPaymentMethodAsDefault($input: SetAsDefaultInput!) {
    setPaymentMethodAsDefault(input: $input) {
      id
    }
  }

  mutation destroyPaymentMethod($input: DestroyPaymentMethodInput!) {
    destroyPaymentMethod(input: $input) {
      id
    }
  }
`

interface Props {
  customerId: string
  connectionId: string
}

export const PaymentMethodsList = ({ customerId, connectionId }: Props) => {
  const { translate } = useInternationalization()
  const { openDeletePaymentMethodDialog } = useDeletePaymentMethodDialog()

  const [setPaymentMethodAsDefaultMutation, { error: errorSetAsDefault }] =
    useSetPaymentMethodAsDefaultMutation()

  const [destroyPaymentMethodMutation, { error: errorDestroyPaymentMethod }] =
    useDestroyPaymentMethodMutation()

  const {
    loading,
    error: hasErrorPaymentMethods,
    data: paymentMethodsList,
    refetch,
  } = useConnectionPaymentMethodsList({ customerId, connectionId })

  const setPaymentMethodAsDefault = useCallback(
    async (input: SetAsDefaultInput): Promise<void> => {
      await setPaymentMethodAsDefaultMutation({ variables: { input } })
      refetch()
    },
    [setPaymentMethodAsDefaultMutation, refetch],
  )

  const onDeletePaymentMethod = useCallback(
    (item: PaymentMethodItem) => {
      openDeletePaymentMethodDialog({
        paymentMethod: item,
        onConfirm: async (input: DestroyPaymentMethodInput) => {
          const res = await destroyPaymentMethodMutation({ variables: { input } })
          const hasResErrors = !!res.errors

          if (!hasResErrors) {
            addToast({
              severity: 'success',
              translateKey: translate('text_1762437511802g5ysxig14q5'),
            })
            refetch()
          }
        },
      })
    },
    [destroyPaymentMethodMutation, refetch, translate, openDeletePaymentMethodDialog],
  )

  const { columns, actionColumn } = usePaymentMethodsTableColumns({
    setPaymentMethodAsDefault,
    onDeletePaymentMethod,
  })

  const hasError = hasErrorPaymentMethods || errorSetAsDefault || errorDestroyPaymentMethod

  return (
    <Table
      name="payment-methods-list"
      containerSize={0}
      rowSize={72}
      data={paymentMethodsList}
      placeholder={{
        emptyState: {
          title: translate('text_17624373282988xkhppid3at'),
          subtitle: translate('text_1762437344178ud4kecr8cz9'),
        },
      }}
      actionColumnTooltip={() => translate('text_634687079be251fdb438338f')}
      actionColumn={actionColumn}
      columns={columns}
      isLoading={loading}
      hasError={!!hasError}
    />
  )
}
