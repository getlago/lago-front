import { Typography } from 'lago-design-system'

import UsageBreakdownIndividualSection from '~/components/analytics/usage/UsageBreakdownIndividualSection'
import { NavigationTab, TabManagedBy } from '~/components/designSystem'
import {
  UsageBreakdownMeteredAvailableFilters,
  UsageBreakdownRecurringAvailableFilters,
} from '~/components/designSystem/Filters'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  ANALYTICS_USAGE_BREAKDOWN_METERED_FILTER_PREFIX,
  ANALYTICS_USAGE_BREAKDOWN_RECURRING_FILTER_PREFIX,
} from '~/core/constants/filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type UsageBreakdownSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

export enum UsageBreakdownType {
  Units = 'units',
  Amount = 'amount',
}

const UsageBreakdownSection = ({ premiumWarningDialogRef }: UsageBreakdownSectionProps) => {
  const { translate } = useInternationalization()

  return (
    <section className="flex flex-col">
      <div className="mb-4 flex flex-col gap-2">
        <Typography variant="subhead" color="grey700">
          {translate('text_1746541426463uvvcg8inufk')}
        </Typography>
      </div>

      <NavigationTab
        managedBy={TabManagedBy.INDEX}
        tabs={[
          {
            title: translate('text_1746541426463rudx84rkpr9'),
            component: (
              <UsageBreakdownIndividualSection
                availableFilters={UsageBreakdownMeteredAvailableFilters}
                filtersPrefix={ANALYTICS_USAGE_BREAKDOWN_METERED_FILTER_PREFIX}
                premiumWarningDialogRef={premiumWarningDialogRef}
              />
            ),
          },
          {
            title: translate('text_1746541426463hwo4t13lp09'),
            component: (
              <UsageBreakdownIndividualSection
                availableFilters={UsageBreakdownRecurringAvailableFilters}
                filtersPrefix={ANALYTICS_USAGE_BREAKDOWN_RECURRING_FILTER_PREFIX}
                premiumWarningDialogRef={premiumWarningDialogRef}
                isRecurring={true}
              />
            ),
          },
        ]}
      />
    </section>
  )
}

export default UsageBreakdownSection
