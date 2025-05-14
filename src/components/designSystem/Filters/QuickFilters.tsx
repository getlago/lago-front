import { CustomerAccountTypeQuickFilter } from '~/components/designSystem/Filters/CustomerAccountTypeQuickFilter'
import { TimeGranularitySelector } from '~/components/designSystem/Filters/TimeGranularitySelector'
import { UnitsAmountQuickFilter } from '~/components/designSystem/Filters/UnitsAmountQuickFilter'

import { InvoiceStatusQuickFilter } from './InvoiceStatusQuickFilter'
import { AvailableQuickFilters } from './types'
import { useFilters } from './useFilters'

export const QuickFilters = () => {
  const { quickFiltersType } = useFilters()

  return (
    <div className="flex w-full flex-wrap items-center gap-3 overflow-y-auto">
      {quickFiltersType === AvailableQuickFilters.invoiceStatus ? (
        <InvoiceStatusQuickFilter />
      ) : null}

      {quickFiltersType === AvailableQuickFilters.customerAccountType ? (
        <CustomerAccountTypeQuickFilter />
      ) : null}

      {quickFiltersType === AvailableQuickFilters.timeGranularity ? (
        <TimeGranularitySelector />
      ) : null}

      {quickFiltersType === AvailableQuickFilters.unitsAmount ? <UnitsAmountQuickFilter /> : null}
    </div>
  )
}
