import { LazyQueryExecFunction } from '@apollo/client'
import { DebouncedFunc } from 'lodash'
import debounce from 'lodash/debounce'
import { useCallback, useEffect, useRef, useState } from 'react'

export const DEBOUNCE_SEARCH_MS = window.Cypress ? 0 : 500
const MIN_SEARCH_CHARS = 3

export type UseDebouncedSearch = (
  searchQuery?: LazyQueryExecFunction<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >,
  loading?: boolean,
) => {
  debouncedSearch: DebouncedFunc<(value: string) => void>
  isLoading: boolean
}

export const useDebouncedSearch: UseDebouncedSearch = (searchQuery, loading) => {
  const [isLoading, setIsLoading] = useState(true)
  const startLoading = useRef<number | null>(null)
  const lastSearchTerm = useRef<string | undefined>(undefined)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    // We want to delay the query execution, to prevent sending a query on every key down
    debounce((value: string) => {
      // Terms under MIN_SEARCH_CHARS are treated as "no search" so the unfiltered list is restored
      const searchTerm = (value || '').trim().length >= MIN_SEARCH_CHARS ? value : undefined

      // Prevent firing the same query again (e.g. typing 1-2 chars while the list is unfiltered)
      if (searchTerm === lastSearchTerm.current) return

      lastSearchTerm.current = searchTerm

      searchQuery?.({ variables: { searchTerm } })
    }, DEBOUNCE_SEARCH_MS),
    [],
  )

  useEffect(() => {
    let loadingStateTimeOut: ReturnType<typeof setTimeout>

    if (loading) {
      setIsLoading(true)
      startLoading.current = Date.now()
    } else {
      const elapsed = Date.now() - (startLoading.current ?? Date.now())

      if (elapsed <= DEBOUNCE_SEARCH_MS) {
        loadingStateTimeOut = setTimeout(() => {
          setIsLoading(false)
        }, DEBOUNCE_SEARCH_MS - elapsed)
      } else {
        setIsLoading(false)
      }
    }

    return () => {
      clearTimeout(loadingStateTimeOut)
    }
  }, [loading])

  useEffect(() => {
    searchQuery?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return { debouncedSearch, isLoading: isLoading || !!loading }
}
