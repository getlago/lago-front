import { Button, Typography } from 'lago-design-system'
import { useState } from 'react'

import { UsageBreakdownType } from '~/components/analytics/usage/types'
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

const TRANSLATIONS_MAP: Record<UsageBreakdownType, string> = {
  [UsageBreakdownType.Units]: 'text_17465414264637hzft31ck6c',
  [UsageBreakdownType.Amount]: 'text_1746541426463wcwfuryd12g',
}

const UsageBreakdownSection = ({ premiumWarningDialogRef }: UsageBreakdownSectionProps) => {
  const { translate } = useInternationalization()

  const [breakdownType, setBreakdownType] = useState<UsageBreakdownType>(UsageBreakdownType.Units)

  return (
    <section className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <Typography variant="subhead1" color="grey700">
          {translate('text_1746541426463uvvcg8inufk')}
        </Typography>

        <div className="flex gap-1">
          {[UsageBreakdownType.Units, UsageBreakdownType.Amount].map((_breakdownType, index) => (
            <Button
              key={`usage-breakdown-section-${index}`}
              variant={_breakdownType === breakdownType ? 'secondary' : 'quaternary'}
              onClick={() => setBreakdownType(_breakdownType)}
              size="small"
            >
              {translate(TRANSLATIONS_MAP[_breakdownType])}
            </Button>
          ))}
        </div>
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
                breakdownType={breakdownType}
                premiumWarningDialogRef={premiumWarningDialogRef}
                isBillableMetricRecurring={false}
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
                breakdownType={breakdownType}
                isBillableMetricRecurring={true}
              />
            ),
          },
        ]}
      />
    </section>
  )
}

export default UsageBreakdownSection
