import { gql } from '@apollo/client'

import { QuoteDetailItemFragment, useGetQuoteQuery } from '~/generated/graphql'

gql`
  fragment QuoteDetailItem on Quote {
    id
    number
    versions {
      id
      status
      version
      createdAt
    }
    orderType
    createdAt
    customer {
      id
      name
      externalId
      currency
      netPaymentTerm
      billingConfiguration {
        documentLocale
      }
      billingEntity {
        id
        code
        name
        netPaymentTerm
      }
    }
    owners {
      id
      email
    }
    subscription {
      id
      name
      externalId
      subscriptionAt
      plan {
        id
        name
      }
    }
    currentVersion {
      id
      status
      version
      content
      currency
      startDate
      endDate
      billingItems
      createdAt
    }
  }

  query getQuote($id: ID!) {
    quote(id: $id) {
      ...QuoteDetailItem
    }
  }
`

interface UseQuoteReturn {
  quote: QuoteDetailItemFragment | null | undefined
  loading: boolean
  error: Error | undefined
  refetch: ReturnType<typeof useGetQuoteQuery>['refetch']
}

export const useQuote = (id?: string): UseQuoteReturn => {
  const { data, loading, error, refetch } = useGetQuoteQuery({
    variables: { id: id || '' },
    skip: !id,
  })

  return {
    quote: data?.quote,
    loading,
    error,
    refetch,
  }
}
