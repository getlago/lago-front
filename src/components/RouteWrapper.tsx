import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import styled from 'styled-components'
import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

import { Icon } from '~/components/designSystem'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { routes, CustomRouteObject, LOGIN_ROUTE, HOME_ROUTE } from '~/core/router'

export const routesFormatter: (
  routesToFormat: CustomRouteObject[],
  loggedIn: boolean
) => RouteObject[] = (routesToFormat, loggedIn) => {
  return routesToFormat.reduce<RouteObject[]>((acc, route) => {
    const routeConfig = {
      element:
        route.private && !loggedIn ? (
          <Navigate to={LOGIN_ROUTE} />
        ) : route.onlyPublic && loggedIn ? (
          <Navigate to={HOME_ROUTE} />
        ) : route.redirect ? (
          <Navigate to={route.redirect} />
        ) : (
          <Suspense
            fallback={
              <Loader>
                <Icon name="processing" color="info" size="large" animation="spin" />
              </Loader>
            }
          >
            {route.element}
          </Suspense>
        ),
      ...(route.children ? { children: routesFormatter(route.children, loggedIn) } : {}),
    }

    if (route.index) {
      acc.push({
        index: true,
        ...routeConfig,
      })
    } else if (!route.path) {
      acc.push(routeConfig)
    } else if (typeof route.path === 'string') {
      acc.push({
        path: route.path,
        ...routeConfig,
      })
    } else {
      ;(route.path as string[]).map((singlePath) => {
        acc.push({
          path: singlePath,
          ...routeConfig,
        })
      })
    }

    return acc
  }, [])
}

const Loader = styled.div`
  height: 100%;
  width: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const RouteWrapper = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const formattedRoutes = routesFormatter(routes, isAuthenticated)

  return useRoutes(formattedRoutes)
}
