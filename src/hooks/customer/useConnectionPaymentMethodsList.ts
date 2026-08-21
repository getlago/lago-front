import { gql } from '@apollo/client'

import { useConnectionPaymentMethodsQuery } from '~/generated/graphql'

import { PaymentMethodList } from './usePaymentMethodsList'

// The backend silently caps unpaginated lists at 25; an explicit generous
// limit keeps the whole connection's list visible (the block renders no
// pagination controls)
const PAYMENT_METHODS_LIMIT = 50

// Read through the singular provider connection on purpose: the customer's
// `paymentProviderCustomers` array prepends a NON-persisted manual placeholder
// (a plain hash, not a record), and resolving `paymentMethods` on it crashes
// server-side. The singular field always resolves a real record — and with one
// payment connection per customer it IS the selected connection. Switch to the
// array once the backend resolves nested fields on the placeholder, which
// multiple connections per type will require anyway.
gql`
  query ConnectionPaymentMethods($customerId: ID!, $withDeleted: Boolean, $limit: Int) {
    customer(id: $customerId) {
      id
      providerCustomer {
        id
        paymentMethods(withDeleted: $withDeleted, limit: $limit) {
          collection {
            ...PaymentMethodItem
          }
        }
      }
    }
  }
`

interface UseConnectionPaymentMethodsListReturn {
  loading: boolean
  error: boolean
  data: PaymentMethodList
  refetch: () => Promise<unknown>
}

interface UseConnectionPaymentMethodsListArgs {
  customerId?: string
  /** Id of the selected payment connection — rows of any other connection are never returned */
  connectionId?: string
  withDeleted?: boolean
  skip?: boolean
}

type UseConnectionPaymentMethodsList = (
  args: UseConnectionPaymentMethodsListArgs,
) => UseConnectionPaymentMethodsListReturn

export const useConnectionPaymentMethodsList: UseConnectionPaymentMethodsList = ({
  customerId = '',
  connectionId = '',
  withDeleted = true,
  skip = false,
}) => {
  const { data, loading, error, refetch } = useConnectionPaymentMethodsQuery({
    variables: {
      customerId,
      withDeleted,
      limit: PAYMENT_METHODS_LIMIT,
    },
    skip: skip || !customerId || !connectionId,
  })

  const connection = data?.customer?.providerCustomer

  return {
    loading,
    error: !!error,
    // The id guard keeps a stale cache entry from leaking another
    // connection's methods right after a provider switch
    data: connection?.id === connectionId ? connection.paymentMethods.collection : [],
    refetch,
  }
}
