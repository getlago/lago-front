import { Icon } from '~/components/designSystem'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import NewAnalytics from '~/pages/analytics/NewAnalytics'
import OldAnalytics from '~/pages/OldAnalytics'

const Analytics = () => {
  const { hasOrganizationPremiumAddon, loading: organizationDataLoading } = useOrganizationInfos()

  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  if (organizationDataLoading) {
    return (
      <div className="m-auto flex size-full items-center justify-center">
        <Icon name="processing" color="info" size="large" animation="spin" />
      </div>
    )
  }

  if (!hasAccessToAnalyticsDashboardsFeature) {
    return <OldAnalytics />
  }

  return <NewAnalytics />
}

export default Analytics
