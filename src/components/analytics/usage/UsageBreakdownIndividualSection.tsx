import { Button } from 'lago-design-system'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { UsageBreakdownType } from '~/components/analytics/usage/types'
import UsageBreakdownBillableMetrics from '~/components/analytics/usage/UsageBreakdownBillableMetrics'
import { useUsageAnalyticsBreakdown } from '~/components/analytics/usage/useUsageAnalyticsBreakdown'
import {
  AvailableFiltersEnum,
  Filters,
  formatFiltersForUsageOverviewQuery,
} from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { TimeGranularityEnum } from '~/generated/graphql'
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
  const [searchParams] = useSearchParams()
  const [showDeletedBillableMetrics, setShowDeletedBillableMetrics] = useState<boolean>(false)

  const timeGranularity = useMemo(() => {
    const filters = formatFiltersForUsageOverviewQuery(searchParams)

    return filters?.timeGranularity as TimeGranularityEnum
  }, [searchParams])

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
    hasDeletedBillableMetrics,
  } = useUsageAnalyticsBreakdown({
    availableFilters,
    filtersPrefix,
    isBillableMetricRecurring,
    showDeletedBillableMetrics,
    breakdownType,
    overridenTimeGranularity: timeGranularity,
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
        defaultStaticTimeGranularity={timeGranularity || getDefaultStaticTimeGranularityFilter()}
        selectedCurrency={selectedCurrency}
        filtersPrefix={filtersPrefix}
        loading={isLoading}
        valueKey={valueKey}
        displayFormat={displayFormat}
        hasError={hasError}
      />

      {hasDeletedBillableMetrics && (
        <div className="mt-6 flex">
          <Button
            startIcon="eye"
            variant={showDeletedBillableMetrics ? 'secondary' : 'quaternary'}
            onClick={() => {
              setShowDeletedBillableMetrics(!showDeletedBillableMetrics)
            }}
          >
            {translate('text_1748270946222tj9ehmsu4f7')}
          </Button>
        </div>
      )}
    </>
  )
}

export default UsageBreakdownIndividualSection
