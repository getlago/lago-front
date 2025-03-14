import { createContext, FC, PropsWithChildren, useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { PopperProps } from '~/components/designSystem'

import { AvailableFiltersEnum, AvailableQuickFilters } from './types'

interface FilterContextType {
  availableFilters: AvailableFiltersEnum[]
  quickFiltersType?: AvailableQuickFilters
  staticFilters?: Partial<Record<AvailableFiltersEnum, string>>
  staticQuickFilters?: Partial<Record<AvailableQuickFilters, string>>
  filtersNamePrefix: string
  buttonOpener?: PopperProps['opener']
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
    if (props.staticFilters || props.staticQuickFilters) {
      const staticFiltersEntries = Object.entries(props.staticFilters || []) as [
        AvailableFiltersEnum,
        unknown,
      ][]
      const staticQuickFiltersEntries = Object.entries(props.staticQuickFilters || []) as [
        AvailableQuickFilters,
        unknown,
      ][]

      for (const [key, value] of [...staticFiltersEntries, ...staticQuickFiltersEntries]) {
        const prefixedKey = `${props.filtersNamePrefix}_${key}`

        if (!searchParams.has(prefixedKey)) {
          searchParams.set(prefixedKey, String(value))
        }
      }

      navigate({ search: searchParams.toString() })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
