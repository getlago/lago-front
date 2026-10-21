import { Typography } from '~/components/designSystem/Typography'
import { RealtimeUsageAvailableFilters } from '~/components/Filters'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import { FullscreenPage } from '~/components/layouts/FullscreenPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RealtimeUsageFilters } from '~/pages/realtimeUsage/common/RealtimeUsageFilters'
import { useRealtimeUsageFilters } from '~/pages/realtimeUsage/common/useRealtimeUsageFilters'
import { RealtimeUsageBillableMetricsSection } from '~/pages/realtimeUsage/overview/RealtimeUsageBillableMetricsSection'
import { RealtimeUsageEventsSection } from '~/pages/realtimeUsage/overview/RealtimeUsageEventsSection'

const RealtimeUsageOverview = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { filters, now, refresh, isEnabled } = useRealtimeUsageFilters()

  return (
    <>
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
              onRefresh={refresh}
            />
          </div>

          <RealtimeUsageEventsSection filters={filters} skip={!isEnabled} />
          <RealtimeUsageBillableMetricsSection filters={filters} now={now} skip={!isEnabled} />
        </div>
      </FullscreenPage.Wrapper>
    </>
  )
}

export default RealtimeUsageOverview
