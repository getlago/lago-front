import { useNavigate, useSearchParams } from 'react-router-dom'

import { useFilterContext } from './context'
import { AvailableFiltersEnum } from './types'

export type FiltersFormValues = {
  filters: Array<{
    filterType?: AvailableFiltersEnum
    value?: string
    disabled?: boolean
  }>
}

export const useFilters = () => {
  const context = useFilterContext()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const searchParamsObject = Object.fromEntries(searchParams.entries())

  const resetFilters = () => {
    // Only remove the filters from the URL that are currently applied and are removable (availableFilters)
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
      // If the filterType is not set or the value is not set, then do nothing
      if (!cur.filterType || cur.value === undefined) {
        return acc
      }

      if (
        context.staticFilters?.[cur.filterType] ||
        context.availableFilters.includes(cur.filterType)
      ) {
        acc.delete(cur.filterType)
        acc.append(cur.filterType, cur.value)
      }

      return acc
    }, new URLSearchParams())

    navigate({ search: newUrlSearchParams.toString() })
  }

  const getInitialFiltersFormValues = (from: 'default' | 'url') => {
    // We sometimes want to get the initial filters from the URL and sometimes from the default filters at instantiation
    const source =
      from === 'default'
        ? Object.entries(context.staticFilters ?? {})
        : Object.entries(searchParamsObject)

    return source.reduce<FiltersFormValues['filters']>((acc, cur) => {
      const [key, value] = cur as [AvailableFiltersEnum, FiltersFormValues['filters'][0]['value']]

      if (!context.availableFilters.includes(key) && !context.staticFilters?.[key]) {
        return acc
      }

      return [
        ...acc,
        {
          filterType: key,
          value,
          disabled: !!context.staticFilters?.[key],
        },
      ]
    }, [])
  }

  const hasAppliedFilters = () => {
    if (searchParamsObject) {
      return Object.keys(searchParamsObject).some((key) =>
        context.availableFilters.includes(key as AvailableFiltersEnum),
      )
    }

    return false
  }

  return {
    ...context,
    hasAppliedFilters: hasAppliedFilters(),
    initialFiltersFormValues: getInitialFiltersFormValues('url'),
    staticFiltersFormValues: getInitialFiltersFormValues('default'),
    applyFilters,
    resetFilters,
  }
}
