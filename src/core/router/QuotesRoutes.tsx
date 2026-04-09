import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
const QuotesList = lazyLoad(() => import('~/pages/quotes/QuotesList'))

// ----------- Routes -----------
export const QUOTES_LIST_ROUTE = '/quotes'

export const quotesRoutes: CustomRouteObject[] = [
  {
    path: QUOTES_LIST_ROUTE,
    private: true,
    element: <QuotesList />,
  },
]
