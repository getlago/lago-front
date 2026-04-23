import {
  ADMIN_LOGIN_ROUTE,
  ADMIN_PORTAL_AUDIT_ROUTE,
  ADMIN_PORTAL_ORGANIZATION_DETAIL_ROUTE,
  ADMIN_PORTAL_ORGANIZATIONS_ROUTE,
  ADMIN_PORTAL_USERS_ROUTE,
} from '~/pages/admin/routes'

import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Layout -----------
const AdminLayout = lazyLoad(() => import('~/pages/admin/AdminLayout'))
const AdminPortal = lazyLoad(() => import('~/pages/admin/AdminPortal'))

// ----------- Pages -----------
const AdminLogin = lazyLoad(() => import('~/pages/admin/AdminLogin'))
const AdminOrganizations = lazyLoad(() => import('~/pages/admin/AdminOrganizations'))
const AdminOrganizationDetail = lazyLoad(
  () => import('~/pages/admin/AdminOrganizationDetail'),
)
const AdminAuditLogs = lazyLoad(() => import('~/pages/admin/AdminAuditLogs'))
const AdminUsers = lazyLoad(() => import('~/pages/admin/AdminUsers'))

// ----------- Routes -----------
export const adminRoutes: CustomRouteObject[] = [
  {
    element: <AdminLayout />,
    adminRoute: true,
    children: [
      {
        path: ADMIN_LOGIN_ROUTE,
        element: <AdminLogin />,
        adminRoute: true,
      },
      {
        element: <AdminPortal />,
        adminRoute: true,
        children: [
          {
            path: ADMIN_PORTAL_ORGANIZATIONS_ROUTE,
            element: <AdminOrganizations />,
            adminRoute: true,
          },
          {
            path: ADMIN_PORTAL_ORGANIZATION_DETAIL_ROUTE,
            element: <AdminOrganizationDetail />,
            adminRoute: true,
          },
          {
            path: ADMIN_PORTAL_AUDIT_ROUTE,
            element: <AdminAuditLogs />,
            adminRoute: true,
          },
          {
            path: ADMIN_PORTAL_USERS_ROUTE,
            element: <AdminUsers />,
            adminRoute: true,
          },
        ],
      },
    ],
  },
]
