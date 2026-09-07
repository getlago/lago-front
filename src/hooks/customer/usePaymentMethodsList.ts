import { gql } from '@apollo/client'

import { PaymentMethodItemFragment, usePaymentMethodsQuery } from '~/generated/graphql'

// Shared by the customer-wide query below and the connection-scoped one
// (useConnectionPaymentMethodsList), so both sources produce the same row
// shape and the table cells work against either
gql`
  fragment PaymentMethodItem on PaymentMethod {
    id
    isDefault
    paymentProviderCode
    paymentProviderCustomerId
    paymentProviderType
    paymentProviderName
    providerMethodId
    deletedAt
    createdAt
    details {
      brand
      expirationYear
      expirationMonth
      last4
      type
    }
  }

  query PaymentMethods($externalCustomerId: ID!, $withDeleted: Boolean) {
    paymentMethods(externalCustomerId: $externalCustomerId, withDeleted: $withDeleted) {
      collection {
        ...PaymentMethodItem
      }
    }
  }
`

export type PaymentMethodItem = PaymentMethodItemFragment
export type PaymentMethodList = PaymentMethodItem[]

interface UsePaymentMethodsListReturn {
  loading: boolean
  error: boolean
  data: PaymentMethodList
  refetch: () => Promise<unknown>
}

interface UsePaymentMethodsListArgs {
  externalCustomerId?: string
  withDeleted?: boolean
  skip?: boolean
}

type UsePaymentMethodsList = (args: UsePaymentMethodsListArgs) => UsePaymentMethodsListReturn

export const usePaymentMethodsList: UsePaymentMethodsList = ({
  externalCustomerId = '',
  withDeleted = true,
  skip = false,
}) => {
  const { data, loading, error, refetch } = usePaymentMethodsQuery({
    variables: {
      externalCustomerId,
      withDeleted,
    },
    skip: skip || !externalCustomerId,
  })

  return {
    loading,
    error: !!error,
    data: data?.paymentMethods?.collection || [],
    refetch,
  }
}
