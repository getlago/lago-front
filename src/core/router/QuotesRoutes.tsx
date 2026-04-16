import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
const Quotes = lazyLoad(() => import('~/pages/quotes/Quotes'))
const QuoteDetails = lazyLoad(() => import('~/pages/quotes/QuoteDetails'))
const CreateQuote = lazyLoad(() => import('~/pages/quotes/CreateQuote'))

// ----------- Routes -----------
export const QUOTES_LIST_ROUTE = '/quotes'
export const QUOTES_TAB_ROUTE = `${QUOTES_LIST_ROUTE}/:tab`
export const QUOTE_DETAILS_ROUTE = '/quote/:quoteId/:tab'
export const CREATE_QUOTE_ROUTE = '/quote/create'

export const quotesRoutes: CustomRouteObject[] = [
  {
    path: [QUOTES_LIST_ROUTE, QUOTES_TAB_ROUTE],
    private: true,
    element: <Quotes />,
    permissions: ['quotesView'],
  },
  {
    path: QUOTE_DETAILS_ROUTE,
    private: true,
    element: <QuoteDetails />,
    permissions: ['quotesView'],
  },
]

export const quotesCreationRoutes: CustomRouteObject[] = [
  {
    path: CREATE_QUOTE_ROUTE,
    private: true,
    element: <CreateQuote />,
    permissions: ['quotesCreate'],
  },
]
