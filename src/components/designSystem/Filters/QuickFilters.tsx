import { InvoiceStatusQuickFilter } from './InvoiceStatusQuickFilter'
import { AvailableQuickFilters } from './types'
import { useFilters } from './useFilters'

export const QuickFilters = () => {
  const { quickFiltersType } = useFilters()

  return (
    <div className="flex w-full flex-wrap items-center gap-3 overflow-y-auto">
      {quickFiltersType === AvailableQuickFilters.InvoiceStatus ? (
        <InvoiceStatusQuickFilter />
      ) : null}
    </div>
  )
}
