import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
const Quotes = lazyLoad(() => import('~/pages/quotes/Quotes'))
const QuoteDetails = lazyLoad(() => import('~/pages/quotes/QuoteDetails'))

// ----------- Routes -----------
export const QUOTES_LIST_ROUTE = '/quotes'
export const QUOTES_TAB_ROUTE = `${QUOTES_LIST_ROUTE}/:tab`
export const QUOTE_DETAILS_ROUTE = '/quote/:quoteId/:tab'

export const quotesRoutes: CustomRouteObject[] = [
  {
    path: [QUOTES_LIST_ROUTE, QUOTES_TAB_ROUTE],
    private: true,
    element: <Quotes />,
  },
  {
    path: QUOTE_DETAILS_ROUTE,
    private: true,
    element: <QuoteDetails />,
  },
]
