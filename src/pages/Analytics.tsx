import { Spinner } from '~/components/designSystem/Spinner'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import Dashboards from '~/pages/dashboards/Dashboards'
import Forbidden from '~/pages/Forbidden'

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

  if (!hasAccessToAnalyticsDashboardsFeature) {
    return <Forbidden />
  }

  return <Dashboards />
}

export default Analytics
