import { useEffect } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Icon } from '~/components/designSystem'
import { getItemFromLS, removeItemFromLS } from '~/core/apolloClient'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ANALYTIC_ROUTE, ANALYTIC_TABS_ROUTE, CUSTOMERS_LIST_ROUTE } from '~/core/router'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY } from '~/hooks/core/useLocationHistory'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

const Home = () => {
  const navigate = useNavigate()
  const { loading: isUserLoading, currentMembership } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()
  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  useEffect(() => {
    // Make sure user permissions are loaded before performing redirection
    if (!isUserLoading && !!currentMembership) {
      const lastPrivateVisitedRouteWhileNotConnected: Location | undefined = getItemFromLS(
        LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY,
      )

      if (
        !!lastPrivateVisitedRouteWhileNotConnected &&
        lastPrivateVisitedRouteWhileNotConnected.pathname !== '/'
      ) {
        navigate(lastPrivateVisitedRouteWhileNotConnected, { replace: true })
        // This is a temp value for redirection, should be removed after redirection have been performed
        removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)
      } else if (hasPermissions(['analyticsView']) && !hasAccessToAnalyticsDashboardsFeature) {
        navigate(ANALYTIC_ROUTE, { replace: true })
      } else if (hasPermissions(['dataApiView']) && hasAccessToAnalyticsDashboardsFeature) {
        navigate(
          generatePath(ANALYTIC_TABS_ROUTE, {
            tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
          }),
          { replace: true },
        )
      } else {
        navigate(CUSTOMERS_LIST_ROUTE, { replace: true })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, currentMembership])

  return (
    <div className="flex size-full items-center justify-center">
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}

export default Home
