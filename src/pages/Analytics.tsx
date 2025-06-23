import { Icon } from 'lago-design-system'

import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import NewAnalytics from '~/pages/analytics/NewAnalytics'
import OldAnalytics from '~/pages/OldAnalytics'

const Analytics = () => {
  const {
    hasOrganizationPremiumAddon,
    loading: organizationDataLoading,
    organization,
  } = useOrganizationInfos()

  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  if (organizationDataLoading || !organization?.id) {
    return (
      <div className="m-auto flex size-full items-center justify-center">
        <Icon name="processing" color="info" size="large" animation="spin" />
      </div>
    )
  }

  if (hasAccessToAnalyticsDashboardsFeature) {
    return <NewAnalytics />
  }

  return <OldAnalytics />
}

export default Analytics
