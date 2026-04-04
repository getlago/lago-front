import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Spinner } from '~/components/designSystem/Spinner'
import { getItemFromLS, removeItemFromLS } from '~/core/apolloClient'
import {
  ORGANIZATION_LS_KEY_ID,
  REDIRECT_AFTER_LOGIN_LS_KEY,
} from '~/core/constants/localStorageKeys'
import { ANALYTIC_ROUTE, CUSTOMERS_LIST_ROUTE, FORBIDDEN_ROUTE } from '~/core/router'
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
    if (isUserLoading || isOrganizationLoading || !currentMembership) {
      return
    }

    // Check localStorage for redirect path from SSO login (Google/Okta).
    // This handles the race condition where the onlyPublic route guard
    // redirects here before the SSO callback can navigate to the intended page.
    const ssoRedirectPath = getItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY)

    if (ssoRedirectPath) {
      removeItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY)

      return navigate(ssoRedirectPath, { replace: true })
    }

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

    const canSeeAnalytics =
      hasPermissions(['analyticsView', 'dataApiView']) && hasAccessToAnalyticsDashboardsFeature

    if (canSeeAnalytics) {
      return navigate(ANALYTIC_ROUTE, { replace: true })
    }

    // Prioritize customers view
    if (hasPermissions(['customersView'])) {
      return navigate(CUSTOMERS_LIST_ROUTE, { replace: true })
    }

    const firstViewPermission = findFirstViewPermission()
    const routeForPermission = getRouteForPermission(firstViewPermission)

    navigate(routeForPermission ?? FORBIDDEN_ROUTE, { replace: true })
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
