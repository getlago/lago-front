import { Button } from 'lago-design-system'

import UsageBreakdownBillableMetrics from '~/components/analytics/usage/UsageBreakdownBillableMetrics'
import { useUsageAnalyticsBreakdown } from '~/components/analytics/usage/useUsageAnalyticsBreakdown'
import {
  AvailableFiltersEnum,
  AvailableQuickFilters,
  Filters,
} from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type UsageBreakdownIndividualSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
  availableFilters: AvailableFiltersEnum[]
  filtersPrefix: string
  isRecurring?: boolean
}

const UsageBreakdownIndividualSection = ({
  premiumWarningDialogRef,
  availableFilters,
  filtersPrefix,
  isRecurring,
}: UsageBreakdownIndividualSectionProps) => {
  const { translate } = useInternationalization()

  const {
    data,
    getDefaultStaticDateFilter,
    getDefaultStaticTimeGranularityFilter,
    defaultCurrency,
    hasAccessToAnalyticsDashboardsFeature,
    selectedCurrency,
    isLoading,
  } = useUsageAnalyticsBreakdown({
    availableFilters,
    filtersPrefix,
    isRecurring,
  })

  return (
    <>
      <div className="flex flex-col">
        <Filters.Provider
          filtersNamePrefix={filtersPrefix}
          staticFilters={{
            currency: defaultCurrency,
            date: getDefaultStaticDateFilter(),
          }}
          availableFilters={availableFilters}
          quickFiltersType={AvailableQuickFilters.unitsAmount}
          buttonOpener={({ onClick }) => (
            <Button
              startIcon="filter"
              endIcon={!hasAccessToAnalyticsDashboardsFeature ? 'sparkles' : undefined}
              size="small"
              variant="quaternary"
              onClick={(e) => {
                if (!hasAccessToAnalyticsDashboardsFeature) {
                  e.stopPropagation()
                  premiumWarningDialogRef.current?.openDialog()
                } else {
                  onClick()
                }
              }}
            >
              {translate('text_66ab42d4ece7e6b7078993ad')}
            </Button>
          )}
        >
          <div className="flex w-full flex-col gap-3 pt-4">
            <Filters.Component />
          </div>
        </Filters.Provider>
      </div>

      <UsageBreakdownBillableMetrics
        data={data}
        defaultStaticDatePeriod={getDefaultStaticDateFilter()}
        defaultStaticTimeGranularity={getDefaultStaticTimeGranularityFilter()}
        selectedCurrency={selectedCurrency}
        filtersPrefix={filtersPrefix}
        loading={isLoading}
      />
    </>
  )
}

export default UsageBreakdownIndividualSection
