import { useNavigate, useSearchParams } from 'react-router-dom'

import { useFilterContext } from './context'

export const useFilters = () => {
  const { availableFilters } = useFilterContext()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const resetFilters = () => {
    const searchParamsObject = Object.fromEntries(searchParams)

    // Only remove the filters from the URL that are currently applied
    for (const search in searchParamsObject) {
      // @ts-expect-error - searchParams is typed as a string and not as AvailableFiltersEnum
      if (availableFilters.includes(search)) {
        searchParams.delete(search)
      }
    }

    navigate({ search: searchParams.toString() })
  }

  const hasAppliedFilters = searchParams.size > 0

  return { availableFilters, hasAppliedFilters, resetFilters }
}
