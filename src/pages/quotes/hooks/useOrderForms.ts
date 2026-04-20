import { FetchMoreQueryOptions, gql, OperationVariables } from '@apollo/client'

import {
  GetOrderFormsQuery,
  GetOrderFormsQueryVariables,
  OrderFormListItemFragment,
  useGetOrderFormsQuery,
} from '~/generated/graphql'

gql`
  fragment OrderFormListItem on OrderForm {
    id
    number
    status
    createdAt
    customer {
      id
      name
    }
  }

  query getOrderForms($page: Int, $limit: Int, $status: [OrderFormStatusEnum!]) {
    orderForms(page: $page, limit: $limit, status: $status) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        ...OrderFormListItem
      }
    }
  }
`

interface UseOrderFormsReturn {
  orderForms: OrderFormListItemFragment[]
  metadata: GetOrderFormsQuery['orderForms']['metadata'] | undefined
  loading: boolean
  error: Error | undefined
  fetchMore:
    | ((
        fetchMoreOptions: FetchMoreQueryOptions<OperationVariables, GetOrderFormsQuery>,
      ) => Promise<unknown>)
    | undefined
}

export const useOrderForms = (
  variables?: Omit<GetOrderFormsQueryVariables, 'limit' | 'page'>,
): UseOrderFormsReturn => {
  const { data, loading, error, fetchMore } = useGetOrderFormsQuery({
    variables: {
      limit: 20,
      ...variables,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })

  return {
    orderForms: data?.orderForms?.collection || [],
    metadata: data?.orderForms?.metadata,
    loading,
    error,
    fetchMore,
  }
}
