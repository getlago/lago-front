import { createContext, FC, PropsWithChildren, useContext } from 'react'

import { AvailableFiltersEnum, AvailableQuickFilters } from './types'

interface FilterContextType {
  availableFilters: AvailableFiltersEnum[]
  quickFiltersType?: AvailableQuickFilters
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export const FiltersProvider: FC<PropsWithChildren<FilterContextType>> = ({
  children,
  ...props
}) => {
  return <FilterContext.Provider value={{ ...props }}>{children}</FilterContext.Provider>
}

export const useFilterContext = () => {
  const context = useContext(FilterContext)

  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }

  return context
}
