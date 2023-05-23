import { lazy } from 'react'

import { CustomRouteObject } from './types'

// ----------- Pages -----------
// Lists
const BillableMetricsList = lazy(
  () => import(/* webpackChunkName: 'billable-metrics' */ '~/pages/BillableMetricsList')
)
const PlansList = lazy(() => import(/* webpackChunkName: 'plans-list' */ '~/pages/PlansList'))
const CouponsList = lazy(() => import(/* webpackChunkName: 'coupons-list' */ '~/pages/CouponsList'))
const AddOnsList = lazy(() => import(/* webpackChunkName: 'add-ons-list' */ '~/pages/AddOnsList'))
const InvoicesList = lazy(
  () => import(/* webpackChunkName: 'invoices-list' */ '~/pages/InvoicesList')
)

// Creation
const CreateBillableMetric = lazy(
  () => import(/* webpackChunkName: 'create-billable-metrics' */ '~/pages/CreateBillableMetric')
)
const CreatePlan = lazy(() => import(/* webpackChunkName: 'create-plan' */ '~/pages/CreatePlan'))
const CreateTax = lazy(() => import(/* webpackChunkName: 'create-tax' */ '~/pages/CreateTax'))
const CreateInvoice = lazy(
  () => import(/* webpackChunkName: 'create-plan' */ '~/pages/CreateInvoice')
)
const CreateCoupon = lazy(
  () => import(/* webpackChunkName: 'create-coupon' */ '~/pages/CreateCoupon')
)
const CreateAddOn = lazy(
  () => import(/* webpackChunkName: 'create-add-on' */ '~/pages/CreateAddOn')
)

// ----------- Routes -----------
// Lists
export const HOME_ROUTE = '/'
export const BILLABLE_METRICS_ROUTE = '/billable-metrics'
export const PLANS_ROUTE = '/plans'
export const COUPONS_ROUTE = '/coupons'
export const ADD_ONS_ROUTE = '/add-ons'
export const INVOICES_ROUTE = '/invoices'
export const INVOICES_TAB_ROUTE = '/invoices/:tab'

// Creation
export const CREATE_BILLABLE_METRIC_ROUTE = '/create/billable-metrics'
export const UPDATE_BILLABLE_METRIC_ROUTE = '/update/billable-metric/:id'

export const CREATE_PLAN_ROUTE = '/create/plans'
export const UPDATE_PLAN_ROUTE = '/update/plan/:id'

export const CREATE_COUPON_ROUTE = '/create/coupons'
export const UPDATE_COUPON_ROUTE = '/update/coupons/:id'

export const CREATE_ADD_ON_ROUTE = '/create/add-on'
export const UPDATE_ADD_ON_ROUTE = '/update/add-on/:id'

export const CREATE_TAX_RATE_ROUTE = '/create/tax'
export const UPDATE_TAX_RATE_ROUTE = '/update/tax/:id'

export const CREATE_INVOICE_ROUTE = '/customer/:id/create-invoice'

export const objectListRoutes: CustomRouteObject[] = [
  {
    path: [BILLABLE_METRICS_ROUTE, HOME_ROUTE],
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
    path: [CREATE_TAX_RATE_ROUTE, UPDATE_TAX_RATE_ROUTE],
    private: true,
    element: <CreateTax />,
  },
  {
    path: [CREATE_INVOICE_ROUTE],
    private: true,
    element: <CreateInvoice />,
  },
]
