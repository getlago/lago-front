import { ReactNode, Suspense, useEffect } from 'react'
import { useRoutes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

import { Icon } from '~/components/designSystem'
import { CustomRouteObject, routes } from '~/core/router'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'

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
          <Suspense
            fallback={
              <div className="m-auto flex size-full items-center justify-center">
                <Icon name="processing" color="info" size="large" animation="spin" />
              </div>
            }
          >
            {route.element}
          </Suspense>
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
