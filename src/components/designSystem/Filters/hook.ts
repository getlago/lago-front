import { useNavigate, useSearchParams } from 'react-router-dom'

import { useFilterContext } from './context'
import { AvailableFiltersEnum } from './types'

export type FiltersFormValues = {
  filters: Array<{
    filterType?: AvailableFiltersEnum
    value?: string
  }>
}

export const useFilters = () => {
  const context = useFilterContext()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const searchParamsObject = Object.fromEntries(searchParams.entries())

  const resetFilters = () => {
    // Only remove the filters from the URL that are currently applied
    for (const search in searchParamsObject) {
      // @ts-expect-error - searchParams is typed as a string and not as AvailableFiltersEnum
      if (context.availableFilters.includes(search)) {
        searchParams.delete(search)
      }
    }

    navigate({ search: searchParams.toString() })
  }

  const applyFilters = (values: FiltersFormValues) => {
    const newUrlSearchParams = values.filters.reduce((acc, cur) => {
      if (
        !cur.filterType ||
        cur.value === undefined ||
        !context.availableFilters.includes(cur.filterType)
      ) {
        return acc
      }

      acc.set(cur.filterType, cur.value as string)

      return acc
    }, new URLSearchParams())

    navigate({ search: newUrlSearchParams.toString() })
  }

  const getInitialFilters = () => {
    return Object.entries(searchParamsObject).reduce<FiltersFormValues['filters']>((acc, cur) => {
      const [key, value] = cur as [AvailableFiltersEnum, FiltersFormValues['filters'][0]['value']]

      if (!context.availableFilters.includes(key)) {
        return acc
      }

      return [
        ...acc,
        {
          filterType: key,
          value,
        },
      ]
    }, [])
  }

  return {
    ...context,
    hasAppliedFilters: searchParams.size > 0,
    initialFilters: getInitialFilters(),
    applyFilters,
    resetFilters,
  }
}
