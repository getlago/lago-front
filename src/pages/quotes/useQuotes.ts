import { gql } from '@apollo/client'
import { useEffect } from 'react'

import {
  GetQuotesQueryVariables,
  useGetQuoteQuery,
  useGetQuotesLazyQuery,
} from '~/generated/graphql'

gql`
  fragment QuoteListItem on Quote {
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
    }
  }

  query getQuotes(
    $page: Int
    $limit: Int
    $status: StatusEnum
    $customerId: ID
    $number: String
    $latestVersionOnly: Boolean
  ) {
    quotes(
      page: $page
      limit: $limit
      status: $status
      customerId: $customerId
      number: $number
      latestVersionOnly: $latestVersionOnly
    ) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        ...QuoteListItem
      }
    }
  }
`

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

export const useQuotes = (variables?: Omit<GetQuotesQueryVariables, 'limit' | 'page'>) => {
  const [getQuotes, { data, loading, error, fetchMore }] = useGetQuotesLazyQuery({
    variables: {
      limit: 20,
      ...variables,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  useEffect(() => {
    getQuotes()
  }, [getQuotes])

  return {
    quotes: data?.quotes?.collection || [],
    metadata: data?.quotes?.metadata,
    loading,
    error,
    fetchMore,
  }
}

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
