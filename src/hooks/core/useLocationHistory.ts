import { Location, matchPath, NavigateOptions, useNavigate } from 'react-router-dom'

import {
  addLocationToHistory,
  authTokenVar,
  getItemFromLS,
  locationHistoryVar,
} from '~/core/apolloClient'
import { ORGANIZATION_LS_KEY_ID } from '~/core/constants/localStorageKeys'
import { CustomRouteObject, FORBIDDEN_ROUTE, HOME_ROUTE, LOGIN_ROUTE } from '~/core/router'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { TMembershipPermissions, usePermissions } from '~/hooks/usePermissions'

type GoBack = (
  fallback: string,
  options?: {
    // Previous count represents how many location from now you want to go back to
    previousCount?: number
    exclude?: string | string[]
    state?: NavigateOptions['state']
  },
) => void

type UseLocationHistoryReturn = () => {
  onRouteEnter: (routeConfig: CustomRouteObject, location: Location) => void
  goBack: GoBack
}

const getPreviousLocation = ({
  previousCount = -1,
  exclude,
}: {
  previousCount?: number
  exclude?: string | string[]
}) => {
  const previousLocations = locationHistoryVar()
  const index = exclude
    ? previousLocations.findIndex((location, i) => {
        if (i < Math.abs(previousCount)) {
          return false
        }

        // If exclude, find index of the first location that doesn't match
        const isExcluded =
          typeof exclude === 'string'
            ? matchPath(exclude, location.pathname)
            : exclude.some((pathToExclude) => matchPath(pathToExclude, location.pathname))

        return !isExcluded
      })
    : Math.abs(previousCount)

  return {
    previous: previousLocations[index],
    remainingHistory: index > -1 ? previousLocations.slice(index + 1) : [],
  }
}

const checkRoutePermissions = (
  routeConfig: CustomRouteObject,
  hasPermissions: (permissions: Array<keyof TMembershipPermissions>) => boolean,
  hasPermissionsOr: (permissions: Array<keyof TMembershipPermissions>) => boolean,
): boolean => {
  // No permissions required
  if (!routeConfig.permissions && !routeConfig.permissionsOr) {
    return true
  }

  // Both AND and OR: user must satisfy BOTH conditions
  if (routeConfig.permissions && routeConfig.permissionsOr) {
    return hasPermissions(routeConfig.permissions) && hasPermissionsOr(routeConfig.permissionsOr)
  }

  // Only AND permissions
  if (routeConfig.permissions) {
    return hasPermissions(routeConfig.permissions)
  }

  // Only OR permissions
  return hasPermissionsOr(routeConfig.permissionsOr ?? [])
}

export const useLocationHistory: UseLocationHistoryReturn = () => {
  const navigate = useNavigate()
  const { loading: isCurrentUserLoading } = useCurrentUser()
  const { hasPermissions, hasPermissionsOr } = usePermissions()
  const goBack: GoBack = (fallback, options) => {
    const { previous, remainingHistory } = getPreviousLocation(options || {})

    if (options?.state) {
      navigate(previous || fallback, { state: options.state })
    } else {
      navigate(previous || fallback)
    }

    locationHistoryVar(remainingHistory || [])
  }

  return {
    goBack,
    onRouteEnter: (routeConfig, location) => {
      const isAuthenticated = !!authTokenVar()

      if (routeConfig.onlyPublic && isAuthenticated) {
        /**
         * In case of navigation to a only public route while authenticated
         * Redirect to home, preserving any saved location state from login flow
         */
        navigate(HOME_ROUTE, { state: location.state, replace: true })
      } else if (routeConfig.private && !isAuthenticated) {
        /**
         * In case of navigation to a private route while NOT authenticated
         * Redirect to login and store the intended destination in router state
         */
        navigate(LOGIN_ROUTE, {
          state: {
            from: location,
            orgId: getItemFromLS(ORGANIZATION_LS_KEY_ID),
          },
          replace: true,
        })
      } else if (isAuthenticated && !isCurrentUserLoading) {
        const hasRequiredPermissions = checkRoutePermissions(
          routeConfig,
          hasPermissions,
          hasPermissionsOr,
        )

        if (!hasRequiredPermissions) {
          /**
           * In case of navigation to a private route while authenticated but without permission
           * Redirect to forbidden page
           */
          navigate(FORBIDDEN_ROUTE)
        } else if (!routeConfig?.children && !routeConfig.onlyPublic) {
          /**
           * We add the current location to the history only if :
           * - Current route has no children (to avoid adding Layout route which will result in duplicates)
           * - Current route is not an only public route
           */
          addLocationToHistory(location)
        }
      } else if (!routeConfig?.children && !routeConfig.onlyPublic) {
        // In the invitation for page, once users are logged in, we redirect them to the home page
        if (routeConfig.invitation && isAuthenticated) {
          // We can then safely redirect to the home page.
          navigate(HOME_ROUTE)
        }
        /**
         * We add the current location to the history only if :
         * - Current route has no children (to avoid adding Layout route which will result in duplicates)
         * - Current route is not an only public route
         */
        addLocationToHistory(location)
      }
    },
  }
}
