import { useCallback, useEffect, useState } from 'react'
import { debounce, DebouncedFunc } from 'lodash'
import { LazyQueryExecFunction } from '@apollo/client'

import { Exact, InputMaybe } from '~/generated/graphql'

export const DEBOUNCE_SEARCH_MS = 500

export type UseDebouncedSearch = (
  searchQuery?: LazyQueryExecFunction<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    Exact<{
      page?: InputMaybe<number> | undefined
      limit?: InputMaybe<number> | undefined
      searchTerm?: InputMaybe<string> | undefined
    }>
  >,
  loading?: boolean
) => {
  debouncedSearch?: DebouncedFunc<(value: unknown) => void>
  isSearchLoading?: boolean
}

export const useDebouncedSearch: UseDebouncedSearch = (searchQuery, loading) => {
  const [isLoading, setIsLoading] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      searchQuery &&
        searchQuery({
          variables: { searchTerm: value },
        })
    }, DEBOUNCE_SEARCH_MS),
    []
  )

  useEffect(() => {
    // This is to prenvent loading blink if the loading time is really small
    setIsLoading(true)
    const debounceLoading = setTimeout(() => {
      setIsLoading(loading || false)
    }, DEBOUNCE_SEARCH_MS)

    return () => {
      clearTimeout(debounceLoading)
    }
  }, [loading])

  useEffect(() => {
    searchQuery && searchQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return { debouncedSearch: debouncedSearch || undefined, isSearchLoading: isLoading || undefined }
}
