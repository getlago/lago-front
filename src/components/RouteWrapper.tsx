import { Suspense, ReactNode, useEffect } from 'react'
import { IndexRouteProps, useRoutes } from 'react-router-dom'
import styled from 'styled-components'
import { useLocation } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'

import { Icon } from '~/components/designSystem'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { routes, CustomRouteObject } from '~/core/router'
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

export const routesFormatter: (
  routesToFormat: CustomRouteObject[],
  loggedIn: boolean
) => RouteObject[] = (routesToFormat, loggedIn) => {
  return routesToFormat.reduce<RouteObject[]>((acc, route) => {
    const routeConfig = {
      element: (
        <PageWrapper routeConfig={route}>
          <Suspense
            fallback={
              <Loader>
                <Icon name="processing" color="info" size="large" animation="spin" />
              </Loader>
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
      } as IndexRouteProps)
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
