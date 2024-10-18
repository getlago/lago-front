import { InvoiceStatusQuickFilter } from './InvoiceStatusQuickFilter'
import { AvailableQuickFilters } from './types'

interface QuickFiltersProps {
  type: AvailableQuickFilters
  noPadding?: boolean
}

export const QuickFilters = ({ type }: QuickFiltersProps) => {
  return (
    <div className="flex w-full flex-wrap items-center gap-3 overflow-y-auto">
      {type === AvailableQuickFilters.InvoiceStatus ? <InvoiceStatusQuickFilter /> : null}
    </div>
  )
}
