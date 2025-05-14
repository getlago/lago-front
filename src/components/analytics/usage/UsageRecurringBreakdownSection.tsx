import { gql } from '@apollo/client'
import { Button } from 'lago-design-system'
import { DateTime } from 'luxon'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AnalyticsStateProvider } from '~/components/analytics/AnalyticsStateContext'
import UsageBreakdownBillableMetrics from '~/components/analytics/usage/UsageBreakdownBillableMetrics'
import {
  AvailableQuickFilters,
  Filters,
  formatFiltersForUsageBreakdownRecurringQuery,
  UsageBreakdownRecurringAvailableFilters,
} from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { ANALYTICS_USAGE_BREAKDOWN_RECURRING_FILTER_PREFIX } from '~/core/constants/filters'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CurrencyEnum,
  PremiumIntegrationTypeEnum,
  TimezoneEnum,
  useGetUsageBreakdownQuery,
  useGetUsageBreakdownRecurringQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

type UsageRecurringBreakdownSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

const UsageRecurringBreakdownSection = ({
  premiumWarningDialogRef,
}: UsageRecurringBreakdownSectionProps) => {
  const [searchParams] = useSearchParams()
  const { organization, hasOrganizationPremiumAddon } = useOrganizationInfos()
  const { translate } = useInternationalization()

  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )
  const defaultCurrency = organization?.defaultCurrency || CurrencyEnum.Usd

  const filtersForUsageBreakdownRecurringQuery = useMemo(() => {
    if (!hasAccessToAnalyticsDashboardsFeature) {
      return {
        currency: defaultCurrency,
      }
    }

    return formatFiltersForUsageBreakdownRecurringQuery(searchParams)
  }, [hasAccessToAnalyticsDashboardsFeature, searchParams, defaultCurrency])

  const getDefaultStaticDateFilter = useCallback((): string => {
    const now = DateTime.now().setZone(getTimezoneConfig(TimezoneEnum.TzUtc).name)

    if (!hasAccessToAnalyticsDashboardsFeature) {
      return `${now.minus({ month: 1 }).startOf('day').toISO()},${now.endOf('day').toISO()}`
    }

    return `${now.minus({ month: 12 }).startOf('day').toISO()},${now.endOf('day').toISO()}`
  }, [hasAccessToAnalyticsDashboardsFeature])

  const {
    data: usageBreakdownRecurringData,
    loading: usageBreakdownRecurringLoading,
    error: usageBreakdownRecurringError,
  } = useGetUsageBreakdownQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      ...filtersForUsageBreakdownRecurringQuery,
    },
  })

  return (
    <>
      <div className="flex flex-col">
        <Filters.Provider
          filtersNamePrefix={ANALYTICS_USAGE_BREAKDOWN_RECURRING_FILTER_PREFIX}
          staticFilters={{
            currency: defaultCurrency,
            date: getDefaultStaticDateFilter(),
          }}
          availableFilters={UsageBreakdownRecurringAvailableFilters}
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

      <AnalyticsStateProvider>
        <UsageBreakdownBillableMetrics data={fakeData} />
      </AnalyticsStateProvider>
    </>
  )
}

export default UsageRecurringBreakdownSection
