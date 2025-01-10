import { useFilterContext } from './context'

export const useFilters = () => {
  const { availableFilters } = useFilterContext()

  return { availableFilters }
}
