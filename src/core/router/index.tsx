import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

const Login = lazy(() => import(/* webpackChunkName: 'login' */ '~/pages/auth/Login'))
const SignUp = lazy(() => import(/* webpackChunkName: 'sign-up' */ '~/pages/auth/SignUp'))
const ForgotPassword = lazy(
  () => import(/* webpackChunkName: 'forgot-password' */ '~/pages/auth/ForgotPassword')
)
const ApiKeys = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/pages/ApiKeys'))
const BillableMetricsList = lazy(
  () => import(/* webpackChunkName: 'billable-metrics' */ '~/pages/BillableMetricsList')
)
const CreateBillableMetric = lazy(
  () => import(/* webpackChunkName: 'create-billable-metrics' */ '~/pages/CreateBillableMetric')
)

const SideNavLayout = lazy(() => import(/* webpackChunkName: 'home' */ '~/layouts/SideNavLayout'))

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
export const API_KEYS_ROUTE = '/api-keys'
export const BILLABLE_METRICS_ROUTE = '/billable-metrics'
export const CREATE_BILLABLE_METRICS_ROUTE = '/create/billable-metrics'

export const routes: CustomRouteObject[] = [
  {
    path: HOME_ROUTE,
    element: <SideNavLayout />,
    private: true,
    children: [
      {
        path: API_KEYS_ROUTE,
        private: true,
        element: <ApiKeys />,
      },
      {
        path: BILLABLE_METRICS_ROUTE,
        private: true,
        element: <BillableMetricsList />,
      },
      {
        index: true,
        element: <Test />,
      },
      {
        path: '/test3',
        element: <Test2 />,
      },
    ],
  },
  {
    path: CREATE_BILLABLE_METRICS_ROUTE,
    private: true,
    element: <CreateBillableMetric />,
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
