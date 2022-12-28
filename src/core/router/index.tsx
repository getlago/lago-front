import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

import { AppEnvEnum } from '~/globalTypes'
import { envGlobalVar } from '~/core/apolloClient'

const { appEnv, disableSignUp } = envGlobalVar()

const Error404 = lazy(() => import(/* webpackChunkName: 'error-404' */ '~/pages/Error404'))
const Login = lazy(() => import(/* webpackChunkName: 'login' */ '~/pages/auth/Login'))
const SignUp = lazy(() => import(/* webpackChunkName: 'sign-up' */ '~/pages/auth/SignUp'))
const ForgotPassword = lazy(
  () => import(/* webpackChunkName: 'forgot-password' */ '~/pages/auth/ForgotPassword')
)

const Invitation = lazy(() => import(/* webpackChunkName: 'invitation' */ '~/pages/Invitation'))

const Developers = lazy(
  () => import(/* webpackChunkName: 'developers-layout' */ '~/layouts/Developers')
)
const ApiKeys = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/pages/developers/ApiKeys'))
const Webhook = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/pages/developers/Webhook'))
const Debugger = lazy(
  () => import(/* webpackChunkName: 'api-keys' */ '~/pages/developers/Debugger')
)

const Settings = lazy(() => import(/* webpackChunkName: 'settings' */ '~/layouts/Settings'))
const OrganizationInformations = lazy(
  () =>
    import(
      /* webpackChunkName: 'organization-informations' */ '~/pages/settings/OrganizationInformations'
    )
)
const InvoiceSettings = lazy(
  () => import(/* webpackChunkName: 'tax-rate' */ '~/pages/settings/InvoiceSettings')
)
const Integrations = lazy(
  () => import(/* webpackChunkName: 'integrations' */ '~/pages/settings/Integrations')
)
const StripeIntegration = lazy(
  () => import(/* webpackChunkName: 'stripe-integration' */ '~/pages/settings/StripeIntegration')
)
const GocardlessIntegration = lazy(
  () =>
    import(
      /* webpackChunkName: 'gocardless-integration' */ '~/pages/settings/GocardlessIntegration'
    )
)
const Members = lazy(() => import(/* webpackChunkName: 'members' */ '~/pages/settings/Members'))

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
const CustomerDraftInvoicesList = lazy(
  () => import(/* webpackChunkName: 'customer-details' */ '~/pages/CustomerDraftInvoicesList')
)

const CustomerInvoiceDetails = lazy(
  () => import(/* webpackChunkName: 'customer-details' */ '~/layouts/CustomerInvoiceDetails')
)
const CreateCreditNote = lazy(
  () => import(/* webpackChunkName: 'create-credit-note' */ '~/pages/CreateCreditNote')
)

const CreditNoteDetails = lazy(
  () => import(/* webpackChunkName: 'credit-note-details' */ '~/pages/CreditNoteDetails')
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

// Invitation route
export const INVITATION_ROUTE = '/invitation/:token'

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
export const CUSTOMER_DRAFT_INVOICES_LIST_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/draft-invoices`
export const CUSTOMER_INVOICE_DETAILS_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/invoice/:invoiceId/:tab`

// Credit note
export const CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/invoice/:invoiceId/credit-notes/:creditNoteId`
export const CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/credit-notes/:creditNoteId`
export const CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/invoice/:invoiceId/create/credit-notes`

// Coupons routes
export const COUPONS_ROUTE = '/coupons'
export const CREATE_COUPON_ROUTE = '/create/coupons'
export const UPDATE_COUPON_ROUTE = '/update/coupons/:id'

// Addon routes
export const ADD_ONS_ROUTE = '/add-ons'
export const CREATE_ADD_ON_ROUTE = '/create/add-on'
export const UPDATE_ADD_ON_ROUTE = '/update/add-on/:id'

export const ERROR_404_ROUTE = '/404'

// Developers routes
export const DEVELOPERS_ROUTE = '/developers'
export const API_KEYS_ROUTE = `${DEVELOPERS_ROUTE}/api-keys`
export const WEBHOOK_ROUTE = `${DEVELOPERS_ROUTE}/webhook`
export const DEBUGGER_ROUTE = `${DEVELOPERS_ROUTE}/debugger`

// Settings route
export const SETTINGS_ROUTE = '/settings'
export const INVOICE_SETTINGS_ROUTE = `${SETTINGS_ROUTE}/invoice`
export const VAT_RATE_ROUTE = `${SETTINGS_ROUTE}/tax-rate` // TODO - to maintain old route for now
export const ORGANIZATION_INFORMATIONS_ROUTE = `${SETTINGS_ROUTE}/organization-informations`
export const INTEGRATIONS_ROUTE = `${SETTINGS_ROUTE}/integrations`
export const STRIPE_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/stripe`
export const GOCARDLESS_INTEGRATION_ROUTE = `${SETTINGS_ROUTE}/integrations/gocardless`
export const MEMBERS_ROUTE = `${SETTINGS_ROUTE}/members`

// *********************** Route Available only on dev mode
const DesignSystem = lazy(
  () => import(/* webpackChunkName: 'home' */ '~/pages/__devOnly/DesignSystem')
)

export const ONLY_DEV_DESIGN_SYSTEM_ROUTE = `/design-system`
export const ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE = `${ONLY_DEV_DESIGN_SYSTEM_ROUTE}/:tab`

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
        element: <Developers />,
        children: [
          {
            path: [API_KEYS_ROUTE, DEVELOPERS_ROUTE],
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
            path: [INVOICE_SETTINGS_ROUTE, VAT_RATE_ROUTE],
            private: true,
            element: <InvoiceSettings />,
          },
          {
            path: INTEGRATIONS_ROUTE,
            private: true,
            element: <Integrations />,
          },
          {
            path: MEMBERS_ROUTE,
            private: true,
            element: <Members />,
          },
        ],
      },
      {
        path: STRIPE_INTEGRATION_ROUTE,
        private: true,
        element: <StripeIntegration />,
      },
      {
        path: GOCARDLESS_INTEGRATION_ROUTE,
        private: true,
        element: <GocardlessIntegration />,
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
        path: CUSTOMER_DRAFT_INVOICES_LIST_ROUTE,
        private: true,
        element: <CustomerDraftInvoicesList />,
      },
      {
        path: CUSTOMER_INVOICE_DETAILS_ROUTE,
        private: true,
        element: <CustomerInvoiceDetails />,
      },
      {
        path: [CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE, CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE],
        private: true,
        element: <CreditNoteDetails />,
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
      ...([AppEnvEnum.qa, AppEnvEnum.development].includes(appEnv)
        ? [
            {
              path: [ONLY_DEV_DESIGN_SYSTEM_ROUTE, ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE],
              element: <DesignSystem />,
            },
          ]
        : []),
    ],
  },
  {
    path: CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
    private: true,
    element: <CreateCreditNote />,
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
  ...(!disableSignUp
    ? [
        {
          path: SIGN_UP_ROUTE,
          element: <SignUp />,
          onlyPublic: true,
        },
      ]
    : []),
  {
    path: INVITATION_ROUTE,
    element: <Invitation />,
    onlyPublic: true,
  },
]
