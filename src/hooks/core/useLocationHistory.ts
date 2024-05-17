import { Location, matchPath, useNavigate } from 'react-router-dom'

import { addLocationToHistory, authTokenVar, locationHistoryVar } from '~/core/apolloClient'
import { CustomRouteObject, FORBIDDEN_ROUTE, HOME_ROUTE, LOGIN_ROUTE } from '~/core/router'

import { usePermissions } from '../usePermissions'

type GoBack = (
  fallback: string,
  options?: {
    // Previous count represents how many location from now you want to go back to
    previousCount?: number
    exclude?: string | string[]
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
        const isExluded =
          typeof exclude === 'string'
            ? matchPath(exclude, location.pathname)
            : exclude.some((pathToExclude) => matchPath(pathToExclude, location.pathname))

        return !isExluded
      })
    : Math.abs(previousCount)

  return {
    previous: previousLocations[index],
    remaingHistory: index > -1 ? previousLocations.slice(index + 1) : [],
  }
}

export const useLocationHistory: UseLocationHistoryReturn = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const goBack: GoBack = (fallback, options) => {
    const { previous, remaingHistory } = getPreviousLocation(options || {})

    navigate(previous || fallback)

    locationHistoryVar(remaingHistory || [])
  }

  return {
    onRouteEnter: (routeConfig, location) => {
      const isAuthenticated = !!authTokenVar()

      if (routeConfig.onlyPublic && isAuthenticated) {
        /**
         * In case of navigation to a only public route while authenticated
         * Go back to previously visited page in app or fallback to the home
         */
        goBack(HOME_ROUTE, { previousCount: 0 })
      } else if (routeConfig.private && !isAuthenticated) {
        /**
         * In case of navigation to a private route while NOT authenticated
         * Redirect to login and add the route the user tried to visit in the history
         */
        navigate(LOGIN_ROUTE)
        addLocationToHistory(location)
      } else if (
        isAuthenticated &&
        routeConfig.permissions?.length &&
        !hasPermissions(routeConfig.permissions)
      ) {
        /**
         * In case of navigation to a private route while authenticated but without permission
         * Redirect to forbidden page
         */
        navigate(FORBIDDEN_ROUTE)
      } else if (!routeConfig?.children && !routeConfig.onlyPublic) {
        // In the invitation for page, once users are logged in, we redirect them to the home page
        if (routeConfig.invitation && isAuthenticated) navigate(HOME_ROUTE)
        /**
         * We add the current location to the history only if :
         * - Current route has no children (to avoid adding Layout route which will result in duplicates)
         * - Current route is not an only public route
         */
        addLocationToHistory(location)
      }
    },
    goBack,
  }
}
