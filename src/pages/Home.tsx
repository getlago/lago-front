import { useEffect } from 'react'
import { generatePath, useLocation, useNavigate } from 'react-router-dom'

import { Spinner } from '~/components/designSystem'
import { getItemFromLS } from '~/core/apolloClient'
import { ORGANIZATION_LS_KEY_ID } from '~/core/constants/localStorageKeys'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  ANALYTIC_ROUTE,
  ANALYTIC_TABS_ROUTE,
  CUSTOMERS_LIST_ROUTE,
  FORBIDDEN_ROUTE,
} from '~/core/router'
import { getRouteForPermission } from '~/core/router/utils/permissionRouteMap'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { loading: isUserLoading, currentMembership } = useCurrentUser()
  const { hasPermissions, findFirstViewPermission } = usePermissions()
  const { hasOrganizationPremiumAddon, loading: isOrganizationLoading } = useOrganizationInfos()
  const hasAccessToAnalyticsDashboardsFeature = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.AnalyticsDashboards,
  )

  useEffect(() => {
    // Make sure user permissions are loaded before performing redirection
    if (!isUserLoading && !isOrganizationLoading && !!currentMembership) {
      // Check if there's a saved location from login redirect in router state
      const routerState = location.state as
        | { from?: Location; orgId?: string | null }
        | null
        | undefined
      const savedLocation = routerState?.from
      const savedOrgId = routerState?.orgId

      if (savedLocation && savedLocation.pathname !== '/') {
        const currentOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)

        // Only redirect if the organization matches (or was null when saved)
        if (!savedOrgId || savedOrgId === currentOrganizationId) {
          // Return navigation to prevent later default redirections from executing
          return navigate(savedLocation, { replace: true })
        }
        // Org mismatch - fall through to default navigation
      }

      // Default home navigation based on permissions
      if (hasPermissions(['analyticsView']) && !hasAccessToAnalyticsDashboardsFeature) {
        navigate(ANALYTIC_ROUTE, { replace: true })
      } else if (hasPermissions(['dataApiView']) && hasAccessToAnalyticsDashboardsFeature) {
        navigate(
          generatePath(ANALYTIC_TABS_ROUTE, {
            tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
          }),
          { replace: true },
        )
        // Prioritize customers view
      } else if (hasPermissions(['customersView'])) {
        navigate(CUSTOMERS_LIST_ROUTE, { replace: true })
      } else {
        const firstViewPermission = findFirstViewPermission()
        const routeForPermission = getRouteForPermission(firstViewPermission)

        if (routeForPermission) {
          navigate(routeForPermission, { replace: true })
        } else {
          navigate(FORBIDDEN_ROUTE, { replace: true })
        }
      }
    }
  }, [
    isUserLoading,
    currentMembership,
    isOrganizationLoading,
    hasPermissions,
    findFirstViewPermission,
    hasAccessToAnalyticsDashboardsFeature,
    navigate,
    location.state,
  ])

  return <Spinner />
}

export default Home
