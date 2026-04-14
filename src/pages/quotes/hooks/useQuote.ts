import { gql } from '@apollo/client'

import { useGetQuoteQuery } from '~/generated/graphql'

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
  }

  query getQuote($id: ID!) {
    quote(id: $id) {
      ...QuoteDetailItem
    }
  }
`

export const useQuote = (id?: string) => {
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
