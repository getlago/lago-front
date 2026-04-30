import { FetchMoreQueryOptions, OperationVariables } from '@apollo/client'

import { GetQuotesQuery } from '~/generated/graphql'

export const createQuotesPaginationHandler = (
  metadata: GetQuotesQuery['quotes']['metadata'] | undefined,
  loading: boolean,
  fetchMore:
    | ((
        fetchMoreOptions: FetchMoreQueryOptions<OperationVariables, GetQuotesQuery>,
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
