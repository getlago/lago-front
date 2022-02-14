import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import Home from '~/pages/Home'
import Test from '~/pages/Test'
import Test2 from '~/pages/Test2'

interface SimpleRoute extends Omit<RouteObject, 'children'> {
  private?: boolean
}
interface CustomRouteObject extends SimpleRoute {
  children?: SimpleRoute[]
}

export const routes: CustomRouteObject[] = [
  {
    path: '/',
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
]

export const formatRoute: (route: CustomRouteObject, loggedIn: boolean) => RouteObject = (
  route,
  loggedIn
) => {
  return {
    path: route.path,
    element: route.private && !loggedIn ? <Navigate to="/" /> : route.element,
    ...(route.children
      ? { children: route.children.map((child: CustomRouteObject) => formatRoute(child, loggedIn)) }
      : {}),
  }
}
