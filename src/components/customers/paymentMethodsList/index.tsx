import { gql } from '@apollo/client'
import { useCallback } from 'react'

import { Table } from '~/components/designSystem/Table'
import {
  DestroyPaymentMethodInput,
  SetAsDefaultInput,
  useDestroyPaymentMethodMutation,
  usePaymentMethodsQuery,
  useSetPaymentMethodAsDefaultMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { usePaymentMethodsTableColumns } from './usePaymentMethodsTableColumns'

gql`
  query PaymentMethods($externalCustomerId: ID!) {
    paymentMethods(externalCustomerId: $externalCustomerId) {
      collection {
        id
        isDefault
        paymentProviderCode
        paymentProviderCustomerId
        paymentProviderType
        details {
          brand
          expirationYear
          expirationMonth
          last4
          type
        }
      }
    }
  }

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
  externalCustomerId: string
}

export const PaymentMethodsList = ({ externalCustomerId }: Props) => {
  const { translate } = useInternationalization()

  const [setPaymentMethodAsDefaultMutation, { error: errorSetAsDefault }] =
    useSetPaymentMethodAsDefaultMutation()

  const [destroyPaymentMethodMutation, { error: errorDestroyPaymentMethod }] =
    useDestroyPaymentMethodMutation()

  const {
    data,
    error: hasErrorPaymentMethods,
    loading,
    refetch,
  } = usePaymentMethodsQuery({
    variables: { externalCustomerId },
  })

  const setPaymentMethodAsDefault = useCallback(
    async (input: SetAsDefaultInput): Promise<void> => {
      await setPaymentMethodAsDefaultMutation({ variables: { input } })
      refetch()
    },
    [setPaymentMethodAsDefaultMutation, refetch],
  )

  const destroyPaymentMethod = useCallback(
    async (input: DestroyPaymentMethodInput): Promise<void> => {
      await destroyPaymentMethodMutation({ variables: { input } })
      refetch()
    },
    [destroyPaymentMethodMutation, refetch],
  )

  const { columns, actionColumn } = usePaymentMethodsTableColumns({
    setPaymentMethodAsDefault,
    destroyPaymentMethod,
  })

  const paymentMethods = data?.paymentMethods?.collection || []
  const hasError = hasErrorPaymentMethods || errorSetAsDefault || errorDestroyPaymentMethod

  return (
    <Table
      name="payment-methods-list"
      containerSize={0}
      rowSize={72}
      data={paymentMethods}
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
