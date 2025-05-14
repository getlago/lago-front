import UsageBreakdownSection from '~/components/analytics/usage/UsageBreakdownSection'
import { UsageBreakdownMeteredAvailableFilters } from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { ANALYTICS_USAGE_BREAKDOWN_METERED_FILTER_PREFIX } from '~/core/constants/filters'

type UsageMeteredBreakdownSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

const UsageMeteredBreakdownSection = ({
  premiumWarningDialogRef,
}: UsageMeteredBreakdownSectionProps) => {
  return (
    <UsageBreakdownSection
      premiumWarningDialogRef={premiumWarningDialogRef}
      availableFilters={UsageBreakdownMeteredAvailableFilters}
      filtersPrefix={ANALYTICS_USAGE_BREAKDOWN_METERED_FILTER_PREFIX}
    />
  )
}

export default UsageMeteredBreakdownSection
