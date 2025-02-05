import { createContext, FC, PropsWithChildren, useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { AvailableFiltersEnum, AvailableQuickFilters } from './types'

interface FilterContextType {
  availableFilters: AvailableFiltersEnum[]
  quickFiltersType?: AvailableQuickFilters
  staticFilters?: Partial<Record<AvailableFiltersEnum, unknown>>
  filtersNamePrefix?: string
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined)

export const FiltersProvider: FC<PropsWithChildren<FilterContextType>> = ({
  children,
  ...props
}) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  /**
   * Set the static filters in the URL
   */
  useEffect(() => {
    if (props.staticFilters) {
      const entries = Object.entries(props.staticFilters) as [AvailableFiltersEnum, unknown][]

      for (const [key, value] of entries) {
        if (!searchParams.has(key)) {
          searchParams.set(key, String(value))
        }
      }

      navigate({ search: searchParams.toString() })
    }
  }, [])

  return <FilterContext.Provider value={{ ...props }}>{children}</FilterContext.Provider>
}

export const useFilterContext = () => {
  const context = useContext(FilterContext)

  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }

  return context
}
