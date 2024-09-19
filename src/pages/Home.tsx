import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { getItemFromLS, removeItemFromLS } from '~/core/apolloClient'
import { ANALYTIC_ROUTE, CUSTOMERS_LIST_ROUTE } from '~/core/router'
import { LAST_PRIVATE_VISITED_ROUTE_WHILE_NOT_CONNECTED_LS_KEY } from '~/hooks/core/useLocationHistory'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

const Home = () => {
  const navigate = useNavigate()
  const { loading: isUserLoading, currentMembership } = useCurrentUser()
  const { hasPermissions } = usePermissions()

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
      } else if (hasPermissions(['analyticsView'])) {
        navigate(ANALYTIC_ROUTE, { replace: true })
      } else {
        navigate(CUSTOMERS_LIST_ROUTE, { replace: true })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, currentMembership])

  return null
}

export default Home
