import { useEffect, useRef } from 'react'
import { debounce } from 'lodash'

export const DEBOUNCE_SEARCH_MS = 500

export const useDebouncedSearch = (searchQuery: Function) => {
  const debouncedSearch = useRef(
    debounce((value) => {
      searchQuery({ variables: { searchTerm: value } })
    }, DEBOUNCE_SEARCH_MS)
  ).current

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return debouncedSearch
}
