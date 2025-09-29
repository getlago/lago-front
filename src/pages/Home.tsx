import { Spinner } from 'lago-design-system'
import { useEffect } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { getItemFromLS, removeItemFromLS } from '~/core/apolloClient'
import {
  LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY,
  ORGANIZATION_LS_KEY_ID,
} from '~/core/constants/localStorageKeys'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { ANALYTIC_ROUTE, ANALYTIC_TABS_ROUTE, CUSTOMERS_LIST_ROUTE } from '~/core/router'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

const Home = () => {
  const navigate = useNavigate()
  const { loading: isUserLoading, currentMembership } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const { hasOrganizationPremiumAddon, loading: isOrganizationLoading } = useOrganizationInfos()
  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  useEffect(() => {
    // Make sure user permissions are loaded before performing redirection
    if (!isUserLoading && !isOrganizationLoading && !!currentMembership) {
      const lastPrivateVisitedRouteWhileNotConnected:
        | { location: Location; organizationId: string }
        | undefined = getItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)

      if (
        !!lastPrivateVisitedRouteWhileNotConnected &&
        !!lastPrivateVisitedRouteWhileNotConnected?.organizationId &&
        lastPrivateVisitedRouteWhileNotConnected?.location?.pathname !== '/'
      ) {
        const currentOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)

        if (lastPrivateVisitedRouteWhileNotConnected.organizationId === currentOrganizationId) {
          // Return navigation to prevent later ones to be performed
          return navigate(lastPrivateVisitedRouteWhileNotConnected.location, { replace: true })
        }

        // This is a temp value for redirection, should be removed if it does not match the current organization
        removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)
      }

      if (hasPermissions(['analyticsView']) && !hasAccessToAnalyticsDashboardsFeature) {
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
  }, [
    isUserLoading,
    currentMembership,
    isOrganizationLoading,
    hasPermissions,
    hasAccessToAnalyticsDashboardsFeature,
    navigate,
  ])

  return <Spinner />
}

export default Home
