import { generatePath } from 'react-router'

import { NewAnalyticsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  ANALYTIC_ROUTE,
  ANALYTIC_TABS_ROUTE,
  CUSTOMERS_LIST_ROUTE,
  FORBIDDEN_ROUTE,
} from '~/core/router'
import { LEGACY_APP_PATH_SEGMENTS } from '~/core/router/legacyPaths'
import { getFirstPathSegment } from '~/core/router/utils/getFirstPathSegment'
import { isSafeInAppPath } from '~/core/router/utils/isSafeInAppPath'
import {
  ensureSlugPrefix,
  isAccessibleOrgSlug,
  pathHasValidSlug,
  pathTargetsInaccessibleOrg,
  resolveOrgSlug,
} from '~/core/router/utils/orgSlug'
import { getRouteForPermission } from '~/core/router/utils/permissionRouteMap'
import { CurrentUserInfosFragment } from '~/generated/graphql'
import { TMembershipPermissions } from '~/hooks/usePermissions'

type CurrentUser = CurrentUserInfosFragment | undefined

const ORGANIZATION_ROOT_PATH = /^\/[^/?#]+\/?(?:[?#].*)?$/

// The org root renders `Home` itself: navigating there would leave it mounted on its spinner.
const isOrganizationRootPath = (path: string, currentUser: CurrentUser): boolean =>
  ORGANIZATION_ROOT_PATH.test(path) && pathHasValidSlug(path, currentUser)

type SavedLocation = {
  pathname: string
  search?: string
  hash?: string
}

export type ResolveRedirectInput = {
  currentUser: CurrentUser
  ssoRedirectPath: string | undefined
  savedLocation: SavedLocation | undefined
  hasPermissions: (permissions: Array<keyof TMembershipPermissions>) => boolean
  findFirstViewPermission: () => keyof TMembershipPermissions | null
  hasAccessToAnalyticsDashboardsFeature: boolean
  isProductCatalogEnabled: boolean
}

export type ResolveRedirectResult = {
  /**
   * Absolute string target OR a Location-like object (used when restoring
   * a saved location from router state, so React Router preserves any
   * additional fields like `state`).
   */
  to: string | SavedLocation
  /**
   * `true` when the resolution consumed `ssoRedirectPath` from LS — Home is
   * responsible for draining the LS key after this returns.
   */
  consumesSsoLs: boolean
}

/**
 * Pure resolver: given the user/auth/permission inputs, returns where Home
 * should redirect. No React, no side effects (LS read happens in the caller
 * and is passed in via `ssoRedirectPath`).
 *
 * Resolution priority:
 *   1. `ssoRedirectPath`: drained by caller, even when ignored for targeting an
 *      org the session cannot open, one the user is not a member of, or an org root.
 *   2. `savedLocation` (router-state `from`): kept only for a non-root path in an
 *      org the session can open, to avoid stale-org leaks; legacy slug-less paths get
 *      prepended with the resolved slug for ALL users (single-org and
 *      multi-org), matching the universal auto-recovery in
 *      `OrganizationLayout`.
 *   3. Permission-based default (analytics → customers → first view route).
 *   4. `FORBIDDEN_ROUTE` fallback.
 *
 * Returns `null` only when the user has no resolvable slug — caller should
 * navigate to `FORBIDDEN_ROUTE` directly. Every other path returns a target.
 */
export const resolveRedirectTarget = (
  input: ResolveRedirectInput,
): ResolveRedirectResult | null => {
  const {
    currentUser,
    ssoRedirectPath,
    savedLocation,
    hasPermissions,
    findFirstViewPermission,
    hasAccessToAnalyticsDashboardsFeature,
    isProductCatalogEnabled,
  } = input

  const slug = resolveOrgSlug(currentUser)

  // An off-origin stored path is ignored but still drained, otherwise it replays
  // on every load. `isSafeInAppPath` is the guard; `ensureSlugPrefix` prefixes
  // and validates nothing.
  const hasUnsafeSsoPath = !!ssoRedirectPath && !isSafeInAppPath(ssoRedirectPath)
  const hasInaccessibleSsoPath =
    !!ssoRedirectPath && pathTargetsInaccessibleOrg(ssoRedirectPath, currentUser)
  const ssoFirstSegment = getFirstPathSegment(ssoRedirectPath ?? '')
  // Stored before a logout, so it may name an org this account never belonged to.
  const hasUnknownOrgSsoPath =
    !!ssoRedirectPath &&
    !!ssoFirstSegment &&
    !LEGACY_APP_PATH_SEGMENTS.has(ssoFirstSegment) &&
    !pathHasValidSlug(ssoRedirectPath, currentUser)
  const hasOrganizationRootSsoPath =
    !!ssoRedirectPath && isOrganizationRootPath(ssoRedirectPath, currentUser)
  const discardsSsoPath =
    hasUnsafeSsoPath || hasInaccessibleSsoPath || hasUnknownOrgSsoPath || hasOrganizationRootSsoPath
  const safeSsoRedirectPath = discardsSsoPath ? undefined : ssoRedirectPath

  if (!slug) {
    return { to: FORBIDDEN_ROUTE, consumesSsoLs: discardsSsoPath }
  }

  // 1. SSO redirect from localStorage (set by auth guard or OAuth callback).
  if (safeSsoRedirectPath) {
    return {
      to: ensureSlugPrefix(safeSsoRedirectPath, slug, currentUser),
      consumesSsoLs: true,
    }
  }

  // 2. Router-state `from` — preserved across same-tab login flows.
  if (savedLocation && savedLocation.pathname !== '/') {
    // Logout + login with another org, or a login method that org refuses,
    // would otherwise carry the old org's path through router state.
    const savedSlug = getFirstPathSegment(savedLocation.pathname)

    if (
      isAccessibleOrgSlug(savedSlug, currentUser) &&
      !isOrganizationRootPath(savedLocation.pathname, currentUser)
    ) {
      return { to: savedLocation, consumesSsoLs: discardsSsoPath }
    }

    const isLegacySegment = LEGACY_APP_PATH_SEGMENTS.has(savedSlug ?? '')
    const isSlugLessLegacyPath =
      isLegacySegment && !pathHasValidSlug(savedLocation.pathname, currentUser)

    if (isSlugLessLegacyPath) {
      const search = savedLocation.search || ''
      const hash = savedLocation.hash || ''

      return {
        to: `/${slug}${savedLocation.pathname}${search}${hash}`,
        consumesSsoLs: discardsSsoPath,
      }
    }
  }

  // 3. Permission-based default.
  const canSeeAnalytics =
    !isProductCatalogEnabled && hasPermissions(['analyticsView', 'dataApiView'])

  if (canSeeAnalytics && !hasAccessToAnalyticsDashboardsFeature) {
    return { to: `/${slug}${ANALYTIC_ROUTE}`, consumesSsoLs: discardsSsoPath }
  }

  if (canSeeAnalytics && hasAccessToAnalyticsDashboardsFeature) {
    return {
      to: `/${slug}${generatePath(ANALYTIC_TABS_ROUTE, {
        tab: NewAnalyticsTabsOptionsEnum.revenueStreams,
      })}`,
      consumesSsoLs: discardsSsoPath,
    }
  }

  if (hasPermissions(['customersView'])) {
    return { to: `/${slug}${CUSTOMERS_LIST_ROUTE}`, consumesSsoLs: discardsSsoPath }
  }

  const firstViewPermission = findFirstViewPermission()
  const routeForPermission = getRouteForPermission(firstViewPermission)

  if (routeForPermission) {
    return {
      to: ensureSlugPrefix(routeForPermission, slug, currentUser),
      consumesSsoLs: discardsSsoPath,
    }
  }

  // 4. No accessible route.
  return { to: FORBIDDEN_ROUTE, consumesSsoLs: discardsSsoPath }
}
