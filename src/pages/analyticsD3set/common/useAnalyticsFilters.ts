import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { ANALYTICS_D3SET_FILTER_PREFIX } from '~/core/constants/filters'
import { useNavigate } from '~/core/router'

import { hasFilterValues, readFilterValues, resetFilterValues, writeFilterValue } from './filters'
import { AnalyticsFilter, AnalyticsFilterValues } from './types'

type AnalyticsFiltersState = {
  values: AnalyticsFilterValues
  hasValues: boolean
  setValue: (filter: AnalyticsFilter, values: string[]) => void
  reset: () => void
}

export const useAnalyticsFilters = (filters: AnalyticsFilter[]): AnalyticsFiltersState => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const prefix = ANALYTICS_D3SET_FILTER_PREFIX

  const values = useMemo(
    () => readFilterValues(searchParams, filters, prefix),
    [searchParams, filters, prefix],
  )

  const setValue = useCallback(
    (filter: AnalyticsFilter, next: string[]) => {
      navigate({ search: writeFilterValue(searchParams, prefix, filter, next).toString() })
    },
    [navigate, searchParams, prefix],
  )

  const reset = useCallback(() => {
    navigate({ search: resetFilterValues(searchParams, prefix).toString() })
  }, [navigate, searchParams, prefix])

  return { values, hasValues: hasFilterValues(searchParams, prefix), setValue, reset }
}
