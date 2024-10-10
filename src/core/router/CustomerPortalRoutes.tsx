import CustomerPortalSections from '~/components/customerPortal/common/CustomerPortalSections'
import CustomerInformationPage from '~/components/customerPortal/customerInformation/CustomerInformationPage'
import UsagePage from '~/components/customerPortal/usage/UsagePage'
import WalletPage from '~/components/customerPortal/wallet/WalletPage'

import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
const PortalInit = lazyLoad(
  () => import(/* webpackChunkName: 'customer-portal-init' */ '~/pages/auth/PortalInit'),
)

// ----------- Routes -----------
export const CUSTOMER_PORTAL_ROUTE = '/customer-portal/:token'
export const CUSTOMER_PORTAL_USAGE_ROUTE = `${CUSTOMER_PORTAL_ROUTE}/usage/:itemId`
export const CUSTOMER_PORTAL_WALLET_ROUTE = `${CUSTOMER_PORTAL_ROUTE}/wallet`
export const CUSTOMER_PORTAL_CUSTOMER_EDIT_INFORMATION_ROUTE = `${CUSTOMER_PORTAL_ROUTE}/customer-edit-information`

export const customerPortalRoutes: CustomRouteObject[] = [
  {
    path: CUSTOMER_PORTAL_ROUTE,
    element: <PortalInit />,
    children: [
      {
        index: true,
        element: <CustomerPortalSections />,
      },
      {
        path: [CUSTOMER_PORTAL_USAGE_ROUTE],
        element: <UsagePage />,
      },
      {
        path: [CUSTOMER_PORTAL_WALLET_ROUTE],
        element: <WalletPage />,
      },
      {
        path: [CUSTOMER_PORTAL_CUSTOMER_EDIT_INFORMATION_ROUTE],
        element: <CustomerInformationPage />,
      },
    ],
  },
]
