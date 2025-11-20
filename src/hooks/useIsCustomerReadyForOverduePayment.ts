import { ApolloError, gql } from '@apollo/client'
import { useParams } from 'react-router-dom'

import { useGetCustomerOverdueInvoicesReadyForPaymentProcessingQuery } from '~/generated/graphql'

gql`
  query getCustomerOverdueInvoicesReadyForPaymentProcessing($id: ID!) {
    invoices(paymentOverdue: true, customerId: $id) {
      collection {
        readyForPaymentProcessing
      }
    }
  }
`

interface UseIsCustomerReadyForOverduePaymentReturn {
  data: boolean
  error: ApolloError | undefined
  loading: boolean
}

export const useIsCustomerReadyForOverduePayment =
  (): UseIsCustomerReadyForOverduePaymentReturn => {
    const { customerId } = useParams()
    const {
      data: { invoices } = {},
      loading,
      error,
    } = useGetCustomerOverdueInvoicesReadyForPaymentProcessingQuery({
      variables: { id: customerId ?? '' },
      skip: !customerId,
      fetchPolicy: 'network-only',
    })

    const invoicesNotReadyForPaymentProcessing =
      invoices?.collection?.filter((invoice) => !invoice.readyForPaymentProcessing) || []

    const data = !loading && !error && invoicesNotReadyForPaymentProcessing.length === 0

    return {
      data,
      loading,
      error,
    }
  }
