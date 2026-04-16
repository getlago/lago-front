import { FetchMoreQueryOptions, gql, OperationVariables } from '@apollo/client'

import {
  GetQuotesQuery,
  GetQuotesQueryVariables,
  QuoteListItemFragment,
  useGetQuotesQuery,
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
    $status: [StatusEnum!]
    $customer: [ID!]
    $number: [String!]
    $latestVersionOnly: Boolean
  ) {
    quotes(
      page: $page
      limit: $limit
      status: $status
      customer: $customer
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
  const { data, loading, error, fetchMore } = useGetQuotesQuery({
    variables: {
      limit: 20,
      ...variables,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  return {
    quotes: data?.quotes?.collection || [],
    metadata: data?.quotes?.metadata,
    loading,
    error,
    fetchMore,
  }
}
