import { gql } from '@apollo/client'

import { QuoteDetailItemFragment, useGetQuoteQuery } from '~/generated/graphql'

gql`
  fragment QuoteDetailItem on Quote {
    id
    number
    status
    version
    orderType
    currency
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
