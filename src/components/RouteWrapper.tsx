import { Spinner } from 'lago-design-system'
import { ReactNode, Suspense, useEffect } from 'react'
import type { RouteObject } from 'react-router-dom'
import { useLocation, useRoutes } from 'react-router-dom'

import { DEVTOOL_ROUTE } from '~/components/developers/DevtoolsRouter'
import { CustomRouteObject, routes } from '~/core/router'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import { DEVTOOL_TAB_PARAMS } from '~/hooks/useDeveloperTool'

interface PageWrapperProps {
  routeConfig: CustomRouteObject
  children: ReactNode
}

const PageWrapper = ({ children, routeConfig }: PageWrapperProps) => {
  const location = useLocation()
  const { onRouteEnter } = useLocationHistory()

  useEffect(() => {
    onRouteEnter(routeConfig, location)
  }, [location, routeConfig, onRouteEnter])

  // Redirect to '/' and open devtools if path starts with DEVTOOL_ROUTE
  useEffect(() => {
    if (location.pathname.startsWith(DEVTOOL_ROUTE)) {
      // Set the devtool param in the URL for the homepage
      const url = new URL(window.location.href)

      url.pathname = '/'
      url.searchParams.set(DEVTOOL_TAB_PARAMS, encodeURIComponent(location.pathname))
      window.location.replace(url.toString())
    }
  }, [location])

  if (location.pathname.startsWith(DEVTOOL_ROUTE)) {
    // Prevent rendering anything while redirecting
    return null
  }

  return <>{children}</>
}

const routesFormatter: (routesToFormat: CustomRouteObject[], loggedIn: boolean) => RouteObject[] = (
  routesToFormat,
  loggedIn,
) => {
  return routesToFormat.reduce<RouteObject[]>((acc, route) => {
    const routeConfig = {
      element: (
        <PageWrapper routeConfig={route}>
          <Suspense fallback={<Spinner />}>{route.element}</Suspense>
        </PageWrapper>
      ),
      ...(route?.children ? { children: routesFormatter(route.children, loggedIn) } : {}),
    }

    if (route.index) {
      acc.push({
        index: true,
        ...routeConfig,
      } as RouteObject)
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

export const RouteWrapper = () => {
  const { isAuthenticated } = useIsAuthenticated()

  const formattedRoutes = routesFormatter(routes, isAuthenticated)

  return useRoutes(formattedRoutes)
}
