import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

const Error404 = lazy(() => import(/* webpackChunkName: 'error-404' */ '~/pages/Error404'))
const Login = lazy(() => import(/* webpackChunkName: 'login' */ '~/pages/auth/Login'))
const SignUp = lazy(() => import(/* webpackChunkName: 'sign-up' */ '~/pages/auth/SignUp'))
const ForgotPassword = lazy(
  () => import(/* webpackChunkName: 'forgot-password' */ '~/pages/auth/ForgotPassword')
)
const ApiKeys = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/pages/ApiKeys'))
const Webhook = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/pages/Webhook'))
const Settings = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/layouts/Settings'))
const BillableMetricsList = lazy(
  () => import(/* webpackChunkName: 'billable-metrics' */ '~/pages/BillableMetricsList')
)
const CreateBillableMetric = lazy(
  () => import(/* webpackChunkName: 'create-billable-metrics' */ '~/pages/CreateBillableMetric')
)
const PlansList = lazy(() => import(/* webpackChunkName: 'plans-list' */ '~/pages/PlansList'))
const CreatePlan = lazy(() => import(/* webpackChunkName: 'create-plan' */ '~/pages/CreatePlan'))
const CustomersList = lazy(
  () => import(/* webpackChunkName: 'customers-list' */ '~/pages/CustomersList')
)
const CustomerDetails = lazy(
  () => import(/* webpackChunkName: 'customer-details' */ '~/pages/CustomerDetails')
)

const SideNavLayout = lazy(() => import(/* webpackChunkName: 'home' */ '~/layouts/SideNavLayout'))

interface CustomRouteObject extends Omit<RouteObject, 'children'> {
  private?: boolean
  onlyPublic?: boolean
  redirect?: string
  children?: CustomRouteObject[]
}

export const LOGIN_ROUTE = '/login'
export const FORGOT_PASSWORD_ROUTE = '/forgot-password'
export const SIGN_UP_ROUTE = '/sign-up'
export const HOME_ROUTE = '/'
export const BILLABLE_METRICS_ROUTE = '/billable-metrics'
export const CREATE_BILLABLE_METRIC_ROUTE = '/create/billable-metrics'
export const UPDATE_BILLABLE_METRIC_ROUTE = '/create/billable-metric/:id'
export const UPDATE_PLAN_ROUTE = '/create/plan/:id'
export const PLANS_ROUTE = '/plans'
export const CREATE_PLAN_ROUTE = '/create/plans'
export const CUSTOMERS_LIST_ROUTE = '/customers'
export const CUSTOMER_DETAILS_ROUTE = '/customer/:id'
export const ERROR_404_ROUTE = '/404'
export const SETTINGS_ROUTE = '/settings'
export const API_KEYS_ROUTE = '/settings/api-keys'
export const WEBHOOK_ROUTE = '/settings/webhook'

export const routes: CustomRouteObject[] = [
  {
    path: '*',
    element: <Error404 />,
  },
  {
    path: ERROR_404_ROUTE,
    element: <Error404 />,
  },
  {
    path: HOME_ROUTE,
    element: <SideNavLayout />,
    private: true,
    children: [
      {
        path: BILLABLE_METRICS_ROUTE,
        private: true,
        element: <BillableMetricsList />,
      },
      {
        path: SETTINGS_ROUTE,
        private: true,
        element: <Settings />,
        children: [
          {
            path: API_KEYS_ROUTE,
            private: true,
            element: <ApiKeys />,
          },
          {
            path: WEBHOOK_ROUTE,
            private: true,
            element: <Webhook />,
          },
        ],
      },
      {
        path: PLANS_ROUTE,
        private: true,
        element: <PlansList />,
      },
      {
        path: CUSTOMERS_LIST_ROUTE,
        private: true,
        element: <CustomersList />,
      },
      {
        path: CUSTOMER_DETAILS_ROUTE,
        private: true,
        element: <CustomerDetails />,
      },
      {
        path: HOME_ROUTE,
        private: true,
        redirect: BILLABLE_METRICS_ROUTE,
      },
    ],
  },
  {
    path: CREATE_BILLABLE_METRIC_ROUTE,
    private: true,
    element: <CreateBillableMetric />,
  },
  {
    path: UPDATE_BILLABLE_METRIC_ROUTE,
    private: true,
    element: <CreateBillableMetric />,
  },
  {
    path: CREATE_PLAN_ROUTE,
    private: true,
    element: <CreatePlan />,
  },
  {
    path: UPDATE_PLAN_ROUTE,
    private: true,
    element: <CreatePlan />,
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
      ) : route.redirect ? (
        <Navigate to={route.redirect} />
      ) : (
        route.element
      ),
    ...(route.children
      ? { children: route.children.map((child: CustomRouteObject) => formatRoute(child, loggedIn)) }
      : {}),
  }
}
