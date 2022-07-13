import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const Error404 = lazy(() => import(/* webpackChunkName: 'error-404' */ '~/pages/Error404'))
const Login = lazy(() => import(/* webpackChunkName: 'login' */ '~/pages/auth/Login'))
const SignUp = lazy(() => import(/* webpackChunkName: 'sign-up' */ '~/pages/auth/SignUp'))
const ForgotPassword = lazy(
  () => import(/* webpackChunkName: 'forgot-password' */ '~/pages/auth/ForgotPassword')
)

const Developpers = lazy(
  () => import(/* webpackChunkName: 'developpers-layout' */ '~/layouts/Developpers')
)
const ApiKeys = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/pages/developpers/ApiKeys'))
const Webhook = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/pages/developpers/Webhook'))
const Debugger = lazy(
  () => import(/* webpackChunkName: 'api-keys' */ '~/pages/developpers/Debugger')
)

const Settings = lazy(() => import(/* webpackChunkName: 'settings' */ '~/layouts/Settings'))
const OrganizationInformations = lazy(
  () =>
    import(
      /* webpackChunkName: 'organization-informations' */ '~/pages/settings/OrganizationInformations'
    )
)
const VatRate = lazy(() => import(/* webpackChunkName: 'tax-rate' */ '~/pages/settings/VatRate'))
const Integrations = lazy(
  () => import(/* webpackChunkName: 'integrations' */ '~/pages/settings/Integrations')
)
const StripeIntegration = lazy(
  () => import(/* webpackChunkName: 'stripe-integration' */ '~/pages/settings/StripeIntegration')
)

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

const CouponsList = lazy(() => import(/* webpackChunkName: 'coupons-list' */ '~/pages/CouponsList'))
const CreateCoupon = lazy(
  () => import(/* webpackChunkName: 'create-coupon' */ '~/pages/CreateCoupon')
)

const AddOnsList = lazy(() => import(/* webpackChunkName: 'add-ons-list' */ '~/pages/AddOnsList'))
const CreateAddOn = lazy(
  () => import(/* webpackChunkName: 'create-coupon' */ '~/pages/CreateAddOn')
)

const SideNavLayout = lazy(() => import(/* webpackChunkName: 'home' */ '~/layouts/SideNavLayout'))

export interface CustomRouteObject extends Omit<RouteObject, 'children' | 'path'> {
  path?: string | string[]
  private?: boolean
  onlyPublic?: boolean
  redirect?: string
  children?: CustomRouteObject[]
}

export const LOGIN_ROUTE = '/login'
export const FORGOT_PASSWORD_ROUTE = '/forgot-password'
export const SIGN_UP_ROUTE = '/sign-up'
export const HOME_ROUTE = '/'

// Billable metrics routes
export const BILLABLE_METRICS_ROUTE = '/billable-metrics'
export const CREATE_BILLABLE_METRIC_ROUTE = '/create/billable-metrics'
export const UPDATE_BILLABLE_METRIC_ROUTE = '/update/billable-metric/:id'

// Plans routes
export const PLANS_ROUTE = '/plans'
export const CREATE_PLAN_ROUTE = '/create/plans'
export const UPDATE_PLAN_ROUTE = '/update/plan/:id'

// Customer routes
export const CUSTOMERS_LIST_ROUTE = '/customers'
export const CUSTOMER_DETAILS_ROUTE = '/customer/:id'
export const CUSTOMER_DETAILS_TAB_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/:tab`

// Coupons routes
export const COUPONS_ROUTE = '/coupons'
export const CREATE_COUPON_ROUTE = '/create/coupons'
export const UPDATE_COUPON_ROUTE = '/update/coupons/:id'

// Addon routes
export const ADD_ONS_ROUTE = '/add-ons'
export const CREATE_ADD_ON_ROUTE = '/create/add-on'
export const UPDATE_ADD_ON_ROUTE = '/update/add-on/:id'

export const ERROR_404_ROUTE = '/404'

// Developpers routes
export const DEVELOPPERS_ROUTE = '/developpers'
export const API_KEYS_ROUTE = `${DEVELOPPERS_ROUTE}/api-keys`
export const WEBHOOK_ROUTE = `${DEVELOPPERS_ROUTE}/webhook`
export const DEBUGGER_ROUTE = `${DEVELOPPERS_ROUTE}/debugger`

// Settings route
export const SETTINGS_ROUTE = '/settings'
export const VAT_RATE_ROUTE = `${SETTINGS_ROUTE}/tax-rate`
export const ORGANIZATION_INFORMATIONS_ROUTE = `${SETTINGS_ROUTE}/organization-informations`
export const INTEGRATIONS_ROUTE = `${SETTINGS_ROUTE}/integrations`
export const STRIPE_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/stripe`

// *********************** Route Available only on dev mode
const DesignSystem = lazy(
  () => import(/* webpackChunkName: 'home' */ '~/pages/__devOnly/DesignSystem')
)

export const ONLY_DEV_DESIGN_SYSTEM_ROUTE = `/design-system`

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
    element: <SideNavLayout />,
    private: true,
    children: [
      {
        path: [BILLABLE_METRICS_ROUTE, HOME_ROUTE],
        private: true,
        element: <BillableMetricsList />,
      },
      {
        private: true,
        element: <Developpers />,
        children: [
          {
            path: [API_KEYS_ROUTE, DEVELOPPERS_ROUTE],
            private: true,
            element: <ApiKeys />,
          },
          {
            path: WEBHOOK_ROUTE,
            private: true,
            element: <Webhook />,
          },
          {
            path: DEBUGGER_ROUTE,
            private: true,
            element: <Debugger />,
          },
        ],
      },
      {
        private: true,
        element: <Settings />,
        children: [
          {
            path: [SETTINGS_ROUTE, ORGANIZATION_INFORMATIONS_ROUTE],
            private: true,
            element: <OrganizationInformations />,
          },
          {
            path: [VAT_RATE_ROUTE],
            private: true,
            element: <VatRate />,
          },
          {
            path: INTEGRATIONS_ROUTE,
            private: true,
            element: <Integrations />,
          },
        ],
      },
      {
        path: STRIPE_INTEGRATION_ROUTE,
        private: true,
        element: <StripeIntegration />,
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
        path: [CUSTOMER_DETAILS_ROUTE, CUSTOMER_DETAILS_TAB_ROUTE],
        private: true,
        element: <CustomerDetails />,
      },
      {
        path: COUPONS_ROUTE,
        private: true,
        element: <CouponsList />,
      },
      {
        path: ADD_ONS_ROUTE,
        private: true,
        element: <AddOnsList />,
      },
      ...(!IS_PROD_ENV
        ? [
            {
              path: ONLY_DEV_DESIGN_SYSTEM_ROUTE,
              element: <DesignSystem />,
            },
          ]
        : []),
    ],
  },
  {
    path: [CREATE_ADD_ON_ROUTE, UPDATE_ADD_ON_ROUTE],
    private: true,
    element: <CreateAddOn />,
  },
  {
    path: [CREATE_COUPON_ROUTE, UPDATE_COUPON_ROUTE],
    private: true,
    element: <CreateCoupon />,
  },
  {
    path: [CREATE_BILLABLE_METRIC_ROUTE, UPDATE_BILLABLE_METRIC_ROUTE],
    private: true,
    element: <CreateBillableMetric />,
  },
  {
    path: [CREATE_PLAN_ROUTE, UPDATE_PLAN_ROUTE],
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
  ...(!LAGO_SIGNUP_DISABLED
    ? [
        {
          path: SIGN_UP_ROUTE,
          element: <SignUp />,
          onlyPublic: true,
        },
      ]
    : []),
]
