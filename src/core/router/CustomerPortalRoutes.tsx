import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
const PortalInit = lazyLoad(
  () => import(/* webpackChunkName: 'customer-portal-init' */ '~/pages/auth/PortalInit'),
)

// ----------- Routes -----------
export const CUSTOMER_PORTAL_ROUTE = '/customer-portal/:token'
export const CUSTOMER_PORTAL_ROUTE_PAGE = '/customer-portal/:token/:page'
export const CUSTOMER_PORTAL_ROUTE_PAGE_ITEMID = '/customer-portal/:token/:page/:itemId'

export const customerPortalRoutes: CustomRouteObject[] = [
  {
    path: CUSTOMER_PORTAL_ROUTE,
    element: <PortalInit />,
  },
  {
    path: CUSTOMER_PORTAL_ROUTE_PAGE,
    element: <PortalInit />,
  },
  {
    path: CUSTOMER_PORTAL_ROUTE_PAGE_ITEMID,
    element: <PortalInit />,
  },
]
