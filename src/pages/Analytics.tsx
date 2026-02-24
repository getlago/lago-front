import { Spinner } from '~/components/designSystem/Spinner'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Dashboards from '~/pages/dashboards/Dashboards'
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
    return <Spinner />
  }

  if (hasAccessToAnalyticsDashboardsFeature) {
    return <Dashboards />
  }

  return <OldAnalytics />
}

export default Analytics
