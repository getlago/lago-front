import { FetchMoreQueryOptions, OperationVariables } from '@apollo/client'

import { GetOrdersQuery } from '~/generated/graphql'

export const createOrdersPaginationHandler = (
  metadata: GetOrdersQuery['orders']['metadata'] | undefined,
  loading: boolean,
  fetchMore:
    | ((
        fetchMoreOptions: FetchMoreQueryOptions<OperationVariables, GetOrdersQuery>,
      ) => Promise<unknown>)
    | undefined,
) => {
  return () => {
    const { currentPage = 0, totalPages = 0 } = metadata || {}

    currentPage < totalPages &&
      !loading &&
      fetchMore?.({
        variables: { page: currentPage + 1 },
      })
  }
}
