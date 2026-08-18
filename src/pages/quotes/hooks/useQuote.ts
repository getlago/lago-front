import { gql } from '@apollo/client'

import { QuoteDetailItemFragment, useGetQuoteQuery } from '~/generated/graphql'

gql`
  fragment QuotePreviewVersion on QuoteVersion {
    content
    billingItems
    mentionVariables
    currency
  }

  fragment QuotePreviewCustomer on Customer {
    currency
    billingConfiguration {
      documentLocale
    }
  }

  fragment QuoteDetailItem on Quote {
    id
    number
    images
    versions {
      id
      status
      version
      createdAt
    }
    # Feeds the activity-logs tab, which asks for the whole quote → order form → order
    # resource set in one query
    orderForms {
      id
      order {
        id
      }
    }
    orderType
    createdAt
    customer {
      id
      displayName
      externalId
      netPaymentTerm
      ...QuotePreviewCustomer
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
      currency
      startDate
      endDate
      createdAt
      ...QuotePreviewVersion
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
