import { FiltersProvider } from './context'
import { Filters as Component } from './Filters'
import { QuickFilters } from './QuickFilters'

export { AvailableFiltersEnum, AvailableQuickFilters } from './types'
export { useFilters } from './useFilters'
export * from './utils'

export const Filters = {
  Provider: FiltersProvider,
  Component: Component,
  QuickFilters: QuickFilters,
}
