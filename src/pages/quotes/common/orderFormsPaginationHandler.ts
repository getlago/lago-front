import { FetchMoreQueryOptions, OperationVariables } from '@apollo/client'

import { GetOrderFormsQuery } from '~/generated/graphql'

export const createOrderFormsPaginationHandler = (
  metadata: GetOrderFormsQuery['orderForms']['metadata'] | undefined,
  loading: boolean,
  fetchMore:
    | ((
        fetchMoreOptions: FetchMoreQueryOptions<OperationVariables, GetOrderFormsQuery>,
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
