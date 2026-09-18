import { gql } from '@apollo/client'

import { useCustomerConnectionPaymentMethodsQuery } from '~/generated/graphql'

import { PaymentMethodList } from './usePaymentMethodsList'

const PAGE_SIZE = 100

gql`
  query CustomerConnectionPaymentMethods($customerId: ID!, $limit: Int!) {
    customer(id: $customerId) {
      id
      paymentProviderCustomers {
        id
        paymentMethods(withDeleted: false, limit: $limit) {
          collection {
            ...PaymentMethodItem
          }
          metadata {
            totalCount
          }
        }
      }
    }
  }
`

interface UseCustomerConnectionPaymentMethodsReturn {
  data: PaymentMethodList
  loading: boolean
  error: boolean
  /** False while the connection holds more methods than one page returned */
  isComplete: boolean
}

interface UseCustomerConnectionPaymentMethodsArgs {
  customerId?: string
  connectionId?: string
  skip?: boolean
}

/**
 * The methods of ONE connection, scoped by the backend rather than filtered here: a method
 * belongs to a connection, and a customer-wide page cannot answer for a connection at all.
 */
export const useCustomerConnectionPaymentMethods = ({
  customerId = '',
  connectionId = '',
  skip = false,
}: UseCustomerConnectionPaymentMethodsArgs): UseCustomerConnectionPaymentMethodsReturn => {
  const { data, loading, error } = useCustomerConnectionPaymentMethodsQuery({
    variables: { customerId, limit: PAGE_SIZE },
    skip: skip || !customerId || !connectionId,
  })

  const connection = data?.customer?.paymentProviderCustomers?.find(
    (item) => item.id === connectionId,
  )
  const collection = connection?.paymentMethods.collection ?? []

  return {
    data: collection,
    loading,
    error: !!error,
    isComplete: (connection?.paymentMethods.metadata.totalCount ?? 0) <= collection.length,
  }
}
