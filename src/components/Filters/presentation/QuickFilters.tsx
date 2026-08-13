import { CustomerAccountTypeQuickFilter } from '~/components/Filters/graphql/CustomerAccountTypeQuickFilter'
import { InvoiceStatusQuickFilter } from '~/components/Filters/graphql/InvoiceStatusQuickFilter'
import { TimeGranularitySelector } from '~/components/Filters/graphql/TimeGranularitySelector'
import { useFilters } from '~/components/Filters/graphql/useFilters'
import { AvailableQuickFilters } from '~/components/Filters/presentation/types'

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
    </div>
  )
}
