import { useEffect } from 'react'
import { generatePath, useLocation } from 'react-router-dom'

import { Spinner } from '~/components/designSystem/Spinner'
import { getItemFromLS, removeItemFromLS } from '~/core/apolloClient'
import { REDIRECT_AFTER_LOGIN_LS_KEY } from '~/core/constants/localStorageKeys'
import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  ANALYTIC_ROUTE,
  ANALYTIC_TABS_ROUTE,
  CUSTOMERS_LIST_ROUTE,
  FORBIDDEN_ROUTE,
  useNavigate,
} from '~/core/router'
import { LEGACY_APP_PATH_SEGMENTS } from '~/core/router/legacyPaths'
import { ensureSlugPrefix, pathHasValidSlug, resolveOrgSlug } from '~/core/router/utils/orgSlug'
import { getRouteForPermission } from '~/core/router/utils/permissionRouteMap'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { loading: isUserLoading, currentUser, currentMembership } = useCurrentUser()
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

    const slug = resolveOrgSlug(currentUser)

    if (!slug) {
      return navigate(FORBIDDEN_ROUTE, { replace: true })
    }

    // This handles the race condition where the onlyPublic route guard
    // redirects here before the SSO callback can navigate to the intended page.
    const ssoRedirectPath = getItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY)

    if (ssoRedirectPath) {
      removeItemFromLS(REDIRECT_AFTER_LOGIN_LS_KEY)

      return navigate(ensureSlugPrefix(ssoRedirectPath, slug, currentUser), { replace: true })
    }

    // Check if there's a saved location from login redirect in router state
    const routerState = location.state as
      | { from?: Location; orgId?: string | null }
      | null
      | undefined
    const savedLocation = routerState?.from

    if (savedLocation && savedLocation.pathname !== '/') {
      // Validate that the slug in the saved path belongs to one of the user's orgs.
      // This prevents a stale path from a previous org session: after logout + login
      // with a different org, location.state.from still carries the old org's path.
      const savedSlug = savedLocation.pathname.split('/')[1]
      const belongsToCurrentUser = currentUser?.memberships?.some(
        (m) => m.organization.slug === savedSlug,
      )

      if (belongsToCurrentUser) {
        return navigate(savedLocation, { replace: true })
      }

      // Legacy path without slug (pre-migration bookmark) — prepend current org slug.
      // Only prepend if the path doesn't start with an unknown slug-like segment
      // (i.e. no valid slug was found above). If the first segment looks like a slug
      // that doesn't belong to the user, fall through to default navigation.
      if (!pathHasValidSlug(savedLocation.pathname, currentUser)) {
        // Check if first segment is a known legacy path (e.g. /customers, /plans)
        const isLegacySegment = LEGACY_APP_PATH_SEGMENTS.has(savedSlug ?? '')

        if (isLegacySegment) {
          return navigate(`/${slug}${savedLocation.pathname}`, { replace: true })
        }
      }
      // Unknown slug or unrecognized path — fall through to default navigation
    }

    const canSeeAnalytics = hasPermissions(['analyticsView', 'dataApiView'])

    // Default home navigation based on permissions
    if (canSeeAnalytics && !hasAccessToAnalyticsDashboardsFeature) {
      return navigate(`/${slug}${ANALYTIC_ROUTE}`, { replace: true })
    }

    if (canSeeAnalytics && hasAccessToAnalyticsDashboardsFeature) {
      return navigate(
        `/${slug}${generatePath(ANALYTIC_TABS_ROUTE, {
          tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
        })}`,
        { replace: true },
      )
    }

    if (hasPermissions(['customersView'])) {
      return navigate(`/${slug}${CUSTOMERS_LIST_ROUTE}`, { replace: true })
    }

    const firstViewPermission = findFirstViewPermission()
    const routeForPermission = getRouteForPermission(firstViewPermission)

    if (routeForPermission) {
      return navigate(ensureSlugPrefix(routeForPermission, slug, currentUser), { replace: true })
    }

    navigate(FORBIDDEN_ROUTE, { replace: true })
  }, [
    isUserLoading,
    currentUser,
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
