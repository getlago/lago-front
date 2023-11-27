import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
// Lists
const BillableMetricsList = lazyLoad(
  () => import(/* webpackChunkName: 'billable-metrics' */ '~/pages/BillableMetricsList'),
)
const PlansList = lazyLoad(() => import(/* webpackChunkName: 'plans-list' */ '~/pages/PlansList'))
const CouponsList = lazyLoad(
  () => import(/* webpackChunkName: 'coupons-list' */ '~/pages/CouponsList'),
)
const AddOnsList = lazyLoad(
  () => import(/* webpackChunkName: 'add-ons-list' */ '~/pages/AddOnsList'),
)
const InvoicesList = lazyLoad(
  () => import(/* webpackChunkName: 'invoices-list' */ '~/pages/InvoicesList'),
)

// Creation
const CreateBillableMetric = lazyLoad(
  () => import(/* webpackChunkName: 'create-billable-metrics' */ '~/pages/CreateBillableMetric'),
)
const CreatePlan = lazyLoad(
  () => import(/* webpackChunkName: 'create-plan' */ '~/pages/CreatePlan'),
)
const CreateTax = lazyLoad(() => import(/* webpackChunkName: 'create-tax' */ '~/pages/CreateTax'))
const CreateInvoice = lazyLoad(
  () => import(/* webpackChunkName: 'create-plan' */ '~/pages/CreateInvoice'),
)
const CreateCoupon = lazyLoad(
  () => import(/* webpackChunkName: 'create-coupon' */ '~/pages/CreateCoupon'),
)
const CreateAddOn = lazyLoad(
  () => import(/* webpackChunkName: 'create-add-on' */ '~/pages/CreateAddOn'),
)
const CreateSubscription = lazyLoad(
  () => import(/* webpackChunkName: 'create-subscription' */ '~/pages/CreateSubscription'),
)
const WalletForm = lazyLoad(
  () => import(/* webpackChunkName: 'wallet-form' */ '~/pages/WalletForm'),
)

// Details
const SubscriptionDetails = lazyLoad(
  () => import(/* webpackChunkName: 'subscription-details' */ '~/pages/SubscriptionDetails'),
)
const PlanDetails = lazyLoad(
  () => import(/* webpackChunkName: 'plan-details' */ '~/pages/PlanDetails'),
)

// ----------- Routes -----------
// Lists
export const BILLABLE_METRICS_ROUTE = '/billable-metrics'
export const PLANS_ROUTE = '/plans'
export const COUPONS_ROUTE = '/coupons'
export const ADD_ONS_ROUTE = '/add-ons'
export const INVOICES_ROUTE = '/invoices'
export const INVOICES_TAB_ROUTE = '/invoices/:tab'

// Creation
export const CREATE_BILLABLE_METRIC_ROUTE = '/create/billable-metrics'
export const UPDATE_BILLABLE_METRIC_ROUTE = '/update/billable-metric/:billableMetricId'

export const CREATE_PLAN_ROUTE = '/create/plans'
export const UPDATE_PLAN_ROUTE = '/update/plan/:planId'

export const CREATE_COUPON_ROUTE = '/create/coupons'
export const UPDATE_COUPON_ROUTE = '/update/coupons/:couponId'

export const CREATE_ADD_ON_ROUTE = '/create/add-on'
export const UPDATE_ADD_ON_ROUTE = '/update/add-on/:addOnId'

export const CREATE_TAX_ROUTE = '/create/tax'
export const UPDATE_TAX_ROUTE = '/update/tax/:taxId'

export const CREATE_INVOICE_ROUTE = '/customer/:customerId/create-invoice'

export const CREATE_SUBSCRIPTION = '/customer/:customerId/create/subscription'
export const UPDATE_SUBSCRIPTION = '/customer/:customerId/update/subscription/:subscriptionId'
export const UPGRADE_DOWNGRADE_SUBSCRIPTION =
  '/customer/:customerId/upgrade-downgrade/subscription/:subscriptionId'

export const CREATE_WALLET_ROUTE = '/customer/:customerId/wallet/create'
export const EDIT_WALLET_ROUTE = '/customer/:customerId/wallet/:walletId'

// Details
export const CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE =
  '/customer/:customerId/subscription/:subscriptionId/:tab'
export const PLAN_SUBSCRIPTION_DETAILS_ROUTE = '/plan/:planId/subscription/:subscriptionId/:tab'
export const PLAN_DETAILS_ROUTE = '/plan/:planId/:tab'
export const CUSTOMER_SUBSCRIPTION_PLAN_DETAILS =
  '/customer/:customerId/subscription/:subscriptionId/plan/:planId/:tab'

export const objectListRoutes: CustomRouteObject[] = [
  {
    path: [BILLABLE_METRICS_ROUTE],
    private: true,
    element: <BillableMetricsList />,
  },
  {
    path: PLANS_ROUTE,
    private: true,
    element: <PlansList />,
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
  {
    path: [INVOICES_ROUTE, INVOICES_TAB_ROUTE],
    private: true,
    element: <InvoicesList />,
  },
]

export const objectCreationRoutes: CustomRouteObject[] = [
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
    path: [CREATE_TAX_ROUTE, UPDATE_TAX_ROUTE],
    private: true,
    element: <CreateTax />,
  },
  {
    path: [CREATE_INVOICE_ROUTE],
    private: true,
    element: <CreateInvoice />,
  },
  {
    path: [CREATE_SUBSCRIPTION, UPDATE_SUBSCRIPTION, UPGRADE_DOWNGRADE_SUBSCRIPTION],
    private: true,
    element: <CreateSubscription />,
  },
  {
    path: [CREATE_WALLET_ROUTE, EDIT_WALLET_ROUTE],
    private: true,
    element: <WalletForm />,
  },
]

export const objectDetailsRoutes: CustomRouteObject[] = [
  {
    path: [CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, PLAN_SUBSCRIPTION_DETAILS_ROUTE],
    private: true,
    element: <SubscriptionDetails />,
  },
  {
    path: [PLAN_DETAILS_ROUTE, CUSTOMER_SUBSCRIPTION_PLAN_DETAILS],
    private: true,
    element: <PlanDetails />,
  },
]
