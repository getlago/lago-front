import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Pages -----------
const PortalInit = lazyLoad(() => import('~/pages/auth/PortalInit'))
const CustomerPortalSections = lazyLoad(
  () => import('~/components/customerPortal/common/CustomerPortalSections'),
)
const UsagePage = lazyLoad(() => import('~/components/customerPortal/usage/UsagePage'))
const WalletPage = lazyLoad(() => import('~/components/customerPortal/wallet/WalletPage'))
const CustomerInformationPage = lazyLoad(
  () => import('~/components/customerPortal/customerInformation/CustomerInformationPage'),
)

// ----------- Routes -----------
export const CUSTOMER_PORTAL_ROUTE = '/customer-portal/:token'
export const CUSTOMER_PORTAL_USAGE_ROUTE = `${CUSTOMER_PORTAL_ROUTE}/usage/:itemId`
export const CUSTOMER_PORTAL_WALLET_ROUTE = `${CUSTOMER_PORTAL_ROUTE}/wallet/:walletId`
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
