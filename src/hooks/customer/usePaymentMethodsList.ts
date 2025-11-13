import { gql } from '@apollo/client'

import { PaymentMethodsQuery, usePaymentMethodsQuery } from '~/generated/graphql'

gql`
  query PaymentMethods($externalCustomerId: ID!) {
    paymentMethods(externalCustomerId: $externalCustomerId, withDeleted: true) {
      collection {
        id
        isDefault
        paymentProviderCode
        paymentProviderCustomerId
        paymentProviderType
        deletedAt
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
`

export type PaymentMethodList = PaymentMethodsQuery['paymentMethods']['collection']
export type PaymentMethodItem = PaymentMethodList[number]

interface UsePaymentMethodsListReturn {
  loading: boolean
  error: boolean
  data: PaymentMethodList
  refetch: () => Promise<unknown>
}

type UsePaymentMethodsList = (args: { externalCustomerId: string }) => UsePaymentMethodsListReturn

export const usePaymentMethodsList: UsePaymentMethodsList = ({ externalCustomerId }) => {
  const { data, loading, error, refetch } = usePaymentMethodsQuery({
    variables: { externalCustomerId },
  })

  return {
    loading,
    error: !!error,
    data: data?.paymentMethods?.collection || [],
    refetch,
  }
}
