import { Button } from 'lago-design-system'

import { UsageBreakdownType } from '~/components/analytics/usage/types'
import UsageBreakdownBillableMetrics from '~/components/analytics/usage/UsageBreakdownBillableMetrics'
import { useUsageAnalyticsBreakdown } from '~/components/analytics/usage/useUsageAnalyticsBreakdown'
import { AvailableFiltersEnum, Filters } from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type UsageBreakdownIndividualSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
  availableFilters: AvailableFiltersEnum[]
  filtersPrefix: string
  isBillableMetricRecurring: boolean
  breakdownType: UsageBreakdownType
}

const UsageBreakdownIndividualSection = ({
  premiumWarningDialogRef,
  availableFilters,
  filtersPrefix,
  isBillableMetricRecurring,
  breakdownType,
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
    hasError,
    valueKey,
    displayFormat,
  } = useUsageAnalyticsBreakdown({
    availableFilters,
    filtersPrefix,
    isBillableMetricRecurring,
    breakdownType,
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
        valueKey={valueKey}
        displayFormat={displayFormat}
        hasError={hasError}
      />
    </>
  )
}

export default UsageBreakdownIndividualSection
