import { lazy } from 'react'

import { CustomRouteObject } from './types'

// ----------- Pages -----------
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

// Credit note related
const CreateCreditNote = lazy(
  () => import(/* webpackChunkName: 'create-credit-note' */ '~/pages/CreateCreditNote')
)
const CreditNoteDetails = lazy(
  () => import(/* webpackChunkName: 'credit-note-details' */ '~/pages/CreditNoteDetails')
)

// ----------- Routes -----------
export const CUSTOMERS_LIST_ROUTE = '/customers'
export const CUSTOMER_DETAILS_ROUTE = '/customer/:id'
export const CUSTOMER_DETAILS_TAB_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/:tab`
export const CUSTOMER_DRAFT_INVOICES_LIST_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/draft-invoices`
export const CUSTOMER_INVOICE_DETAILS_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/invoice/:invoiceId/:tab`

// Credit note related
export const CUSTOMER_INVOICE_CREDIT_NOTE_DETAILS_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/invoice/:invoiceId/credit-notes/:creditNoteId`
export const CUSTOMER_CREDIT_NOTE_DETAILS_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/credit-notes/:creditNoteId`
export const CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE = `${CUSTOMER_DETAILS_ROUTE}/invoice/:invoiceId/create/credit-notes`

export const customerRoutes: CustomRouteObject[] = [
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
]

export const customerObjectCreationRoutes: CustomRouteObject[] = [
  {
    path: CUSTOMER_INVOICE_CREATE_CREDIT_NOTE_ROUTE,
    private: true,
    element: <CreateCreditNote />,
  },
]
