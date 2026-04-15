import { FetchMoreQueryOptions, gql, OperationVariables } from '@apollo/client'
import { useEffect } from 'react'

import {
  GetQuotesQuery,
  GetQuotesQueryVariables,
  QuoteListItemFragment,
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

interface UseQuotesReturn {
  quotes: QuoteListItemFragment[]
  metadata: GetQuotesQuery['quotes']['metadata'] | undefined
  loading: boolean
  error: Error | undefined
  fetchMore:
    | ((
        fetchMoreOptions: FetchMoreQueryOptions<OperationVariables, GetQuotesQuery>,
      ) => Promise<unknown>)
    | undefined
}

export const useQuotes = (
  variables?: Omit<GetQuotesQueryVariables, 'limit' | 'page'>,
): UseQuotesReturn => {
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
