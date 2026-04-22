import { FeatureFlagEnum } from '~/generated/graphql'

import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
const Quotes = lazyLoad(() => import('~/pages/quotes/Quotes'))
const QuoteDetails = lazyLoad(() => import('~/pages/quotes/QuoteDetails'))
const CreateQuote = lazyLoad(() => import('~/pages/quotes/CreateQuote'))
const EditQuote = lazyLoad(() => import('~/pages/quotes/EditQuote'))
const VoidQuote = lazyLoad(() => import('~/pages/quotes/VoidQuote'))
const ApproveQuote = lazyLoad(() => import('~/pages/quotes/ApproveQuote'))

// ----------- Routes -----------
export const QUOTES_LIST_ROUTE = '/quotes'
export const QUOTES_TAB_ROUTE = `${QUOTES_LIST_ROUTE}/:tab`
export const QUOTE_DETAILS_ROUTE = '/quote/:quoteId/:tab'
export const CREATE_QUOTE_ROUTE = '/quote/create'
export const EDIT_QUOTE_ROUTE = '/quote/:quoteId/edit'
export const VOID_QUOTE_ROUTE = '/quote/:quoteId/void'
export const APPROVE_QUOTE_ROUTE = '/quote/:quoteId/approve'

export const quotesRoutes: CustomRouteObject[] = [
  {
    path: [QUOTES_LIST_ROUTE, QUOTES_TAB_ROUTE],
    private: true,
    element: <Quotes />,
    permissions: ['quotesView'],
    featureFlag: FeatureFlagEnum.OrderForms,
  },
  {
    path: QUOTE_DETAILS_ROUTE,
    private: true,
    element: <QuoteDetails />,
    permissions: ['quotesView'],
    featureFlag: FeatureFlagEnum.OrderForms,
  },
]

export const quotesCreationRoutes: CustomRouteObject[] = [
  {
    path: CREATE_QUOTE_ROUTE,
    private: true,
    element: <CreateQuote />,
    permissions: ['quotesCreate'],
    featureFlag: FeatureFlagEnum.OrderForms,
  },
  {
    path: EDIT_QUOTE_ROUTE,
    private: true,
    element: <EditQuote />,
    permissions: ['quotesUpdate'],
  },
]

export const quotesVoidRoutes: CustomRouteObject[] = [
  {
    path: VOID_QUOTE_ROUTE,
    private: true,
    element: <VoidQuote />,
    permissions: ['quotesVoid'],
  },
]

export const quotesApprovalRoutes: CustomRouteObject[] = [
  {
    path: APPROVE_QUOTE_ROUTE,
    private: true,
    element: <ApproveQuote />,
    permissions: ['quotesApprove'],
  },
]
