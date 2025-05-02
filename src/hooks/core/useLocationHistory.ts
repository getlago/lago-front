import { Location, matchPath, NavigateOptions, useNavigate } from 'react-router-dom'

import {
  addLocationToHistory,
  authTokenVar,
  getItemFromLS,
  locationHistoryVar,
  removeItemFromLS,
  setItemFromLS,
} from '~/core/apolloClient'
import {
  LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY,
  ORGANIZATION_LS_KEY_ID,
} from '~/core/constants/localStorageKeys'
import { CustomRouteObject, FORBIDDEN_ROUTE, HOME_ROUTE, LOGIN_ROUTE } from '~/core/router'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

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

export const useLocationHistory: UseLocationHistoryReturn = () => {
  const navigate = useNavigate()
  const { loading: isCurrentUserLoading } = useCurrentUser()
  const { hasPermissions } = usePermissions()
  const goBack: GoBack = (fallback, options) => {
    const { previous, remainingHistory } = getPreviousLocation(options || {})

    if (fallback === HOME_ROUTE) {
      // Make sure the LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY is not set
      // Otherwise, the back redirection will not always work in Home page
      removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)
    }

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
         * Go back to previously visited page in app or fallback to the home
         */
        navigate(HOME_ROUTE)
      } else if (routeConfig.private && !isAuthenticated) {
        /**
         * In case of navigation to a private route while NOT authenticated
         * Redirect to login and add the route the user tried to visit in the history
         */
        navigate({
          pathname: LOGIN_ROUTE,
          search: location.search,
        })

        // If user is kicked out or logs out, we save manually the last private route visited to redirect after login
        setItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY, {
          location,
          organizationId: getItemFromLS(ORGANIZATION_LS_KEY_ID),
        })
      } else if (
        isAuthenticated &&
        routeConfig.permissions?.length &&
        !isCurrentUserLoading &&
        !hasPermissions(routeConfig.permissions)
      ) {
        /**
         * In case of navigation to a private route while authenticated but without permission
         * Redirect to forbidden page
         */
        navigate(FORBIDDEN_ROUTE)
      } else if (!routeConfig?.children && !routeConfig.onlyPublic) {
        // In the invitation for page, once users are logged in, we redirect them to the home page
        if (routeConfig.invitation && isAuthenticated) {
          // We have a special case for the invitation route, we don't want to be redirected to any potential last visited page.
          // If user follows an invitation, we remove this info from the local storage before the redirection happens.
          const lastPrivateVisitedRouteWhileNotConnected: Location = getItemFromLS(
            LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY,
          )

          if (lastPrivateVisitedRouteWhileNotConnected) {
            removeItemFromLS(LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY)
          }

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
