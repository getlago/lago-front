import { FiltersProvider } from '~/components/Filters/presentation/context'
import { Filters as Component } from '~/components/Filters/presentation/Filters'
import { QuickFilters } from '~/components/Filters/presentation/QuickFilters'

export * from '~/components/Filters/presentation/types'
export * from '~/components/Filters/graphql/utils'

export const Filters = {
  Provider: FiltersProvider,
  Component: Component,
  QuickFilters: QuickFilters,
}
