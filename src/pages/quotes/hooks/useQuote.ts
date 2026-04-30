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
    }
    owners {
      id
      email
    }
    subscription {
      id
      name
      externalId
    }
    currentVersion {
      id
      status
      version
      content
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
}

export const useQuote = (id?: string): UseQuoteReturn => {
  const { data, loading, error } = useGetQuoteQuery({
    variables: { id: id || '' },
    skip: !id,
  })

  return {
    quote: data?.quote,
    loading,
    error,
  }
}
