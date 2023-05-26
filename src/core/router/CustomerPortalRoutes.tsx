import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
const PortalInit = lazyLoad(
  () => import(/* webpackChunkName: 'customer-portal-init' */ '~/pages/auth/PortalInit')
)

// ----------- Routes -----------
export const CUSTOMER_PORTAL_ROUTE = '/customer-portal/:token'

export const customerPortalRoutes: CustomRouteObject[] = [
  {
    path: CUSTOMER_PORTAL_ROUTE,
    element: <PortalInit />,
  },
]
