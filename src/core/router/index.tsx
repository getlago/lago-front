import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

const Login = lazy(() => import(/* webpackChunkName: 'login' */ '~/pages/auth/Login'))
const SignUp = lazy(() => import(/* webpackChunkName: 'sign-up' */ '~/pages/auth/SignUp'))
const ForgotPassword = lazy(
  () => import(/* webpackChunkName: 'forgot-password' */ '~/pages/auth/ForgotPassword')
)

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
export const FORGOT_PASSWORD_ROUTE = '/forgot-password'
export const SIGN_UP_ROUTE = '/sign-up'
export const HOME_ROUTE = '/'

export const routes: CustomRouteObject[] = [
  {
    path: HOME_ROUTE,
    element: <Home />,
    private: true,
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
  {
    path: FORGOT_PASSWORD_ROUTE,
    element: <ForgotPassword />,
    onlyPublic: true,
  },
  {
    path: SIGN_UP_ROUTE,
    element: <SignUp />,
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
