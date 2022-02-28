import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

const Login = lazy(() => import(/* webpackChunkName: 'login' */ '~/pages/Login'))

import Home from '~/pages/Home'
import Test from '~/pages/Test'
import Test2 from '~/pages/Test2'

interface SimpleRoute extends Omit<RouteObject, 'children'> {
  private?: boolean
  onlyPublic?: boolean
}
interface CustomRouteObject extends SimpleRoute {
  children?: SimpleRoute[]
}

export const LOGIN_ROUTE = '/login'
export const HOME_ROUTE = '/'

export const routes: CustomRouteObject[] = [
  {
    path: HOME_ROUTE,
    element: <Home />,
    children: [
      {
        index: true,
        element: <Test />,
      },
      {
        path: '/test2',
        private: true,
        element: <Test2 />,
      },
      {
        path: '/test3',
        element: <Test2 />,
      },
    ],
  },
  {
    path: LOGIN_ROUTE,
    element: <Login />,
    onlyPublic: true,
  },
]

export const formatRoute: (route: CustomRouteObject, loggedIn: boolean) => RouteObject = (
  route,
  loggedIn
) => {
  return {
    ...(route.path ? { path: route.path } : { index: true }),
    element:
      route.private && !loggedIn ? (
        <Navigate to={LOGIN_ROUTE} />
      ) : route.onlyPublic && loggedIn ? (
        <Navigate to={HOME_ROUTE} />
      ) : (
        route.element
      ),
    ...(route.children
      ? { children: route.children.map((child: CustomRouteObject) => formatRoute(child, loggedIn)) }
      : {}),
  }
}
