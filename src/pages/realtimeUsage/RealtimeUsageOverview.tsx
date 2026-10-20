import { Typography } from '~/components/designSystem/Typography'
import { RealtimeUsageAvailableFilters } from '~/components/Filters'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RealtimeUsageFilters } from '~/pages/realtimeUsage/common/RealtimeUsageFilters'
import { RealtimeUsageGate } from '~/pages/realtimeUsage/common/RealtimeUsageGate'
import { useRealtimeUsageFilters } from '~/pages/realtimeUsage/common/useRealtimeUsageFilters'
import { RealtimeUsageBillableMetricsSection } from '~/pages/realtimeUsage/overview/RealtimeUsageBillableMetricsSection'
import { RealtimeUsageEventsSection } from '~/pages/realtimeUsage/overview/RealtimeUsageEventsSection'

const RealtimeUsageOverview = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { filters, pollInterval } = useRealtimeUsageFilters()

  return (
    <RealtimeUsageGate>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_17465414264635ktqocy7leo')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

      <FullscreenPage.Wrapper>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <Typography variant="headline" color="grey700">
              {translate('text_17465414264635ktqocy7leo')}
            </Typography>

            <RealtimeUsageFilters
              availableFilters={RealtimeUsageAvailableFilters}
              queryNames={['getRealtimeUsageEvents', 'getRealtimeUsageBillableMetrics']}
            />
          </div>

          <RealtimeUsageEventsSection filters={filters} pollInterval={pollInterval} />
          <RealtimeUsageBillableMetricsSection filters={filters} pollInterval={pollInterval} />
        </div>
      </FullscreenPage.Wrapper>
    </RealtimeUsageGate>
  )
}

export default RealtimeUsageOverview
