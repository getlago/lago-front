import { LazyQueryExecFunction } from '@apollo/client'
import { debounce, DebouncedFunc } from 'lodash'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useRef, useState } from 'react'

export const DEBOUNCE_SEARCH_MS = window.Cypress ? 0 : 500

export type UseDebouncedSearch = (
  searchQuery?: LazyQueryExecFunction<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >,
  loading?: boolean,
) => {
  debouncedSearch?: DebouncedFunc<(value: unknown) => void>
  isLoading: boolean
}

export const useDebouncedSearch: UseDebouncedSearch = (searchQuery, loading) => {
  const [isLoading, setIsLoading] = useState(true)
  const startLoading = useRef<DateTime | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    // We want to delay the query execution, to prevent sending a query on every key down
    debounce((value: string) => {
      searchQuery &&
        searchQuery({
          variables: { searchTerm: value },
        })
    }, DEBOUNCE_SEARCH_MS),
    [],
  )

  useEffect(() => {
    let loadingStateTimeOut: ReturnType<typeof setTimeout>

    if (loading) {
      setIsLoading(true)
      // If query is loading, save the start time
      startLoading.current = DateTime.now()
    } else {
      // If query is not loading anymore, get the diff between the start time and now
      const diff =
        DateTime.now().diff(startLoading.current || DateTime.now(), 'milliseconds')?.milliseconds ||
        0

      // If the diff is bellow the minimum debounce time
      if (diff <= DEBOUNCE_SEARCH_MS) {
        // Timeout the loading to be set to false, to prevent loading blink (if loading is too fast)
        loadingStateTimeOut = setTimeout(() => {
          setIsLoading(false)
        }, DEBOUNCE_SEARCH_MS - diff)
      } else {
        // If time diff is acceptable already, set loading to false
        setIsLoading(false)
      }
    }

    return () => {
      clearTimeout(loadingStateTimeOut)
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

  return { debouncedSearch: debouncedSearch || undefined, isLoading: isLoading || loading || false }
}
