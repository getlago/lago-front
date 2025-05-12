import { CustomRouteObject } from './types'
import { lazyLoad } from './utils'

// ----------- Layouts -----------
const Developers = lazyLoad(() => import('~/layouts/Developers'))

// ----------- Routes -----------
// Developers routes
export const DEVELOPERS_ROUTE = '/developers'
export const WEBHOOK_ROUTE = `${DEVELOPERS_ROUTE}/webhooks`
export const WEBHOOK_LOGS_ROUTE = `${DEVELOPERS_ROUTE}/webhooks/:webhookId/logs`
export const WEBHOOK_LOGS_TAB_ROUTE = `${DEVELOPERS_ROUTE}/webhooks/:webhookId/logs/:tab`
export const DEBUGGER_ROUTE = `${DEVELOPERS_ROUTE}/debugger`

export const developperRoutes: CustomRouteObject[] = [
  {
    private: true,
    element: <Developers />,
    permissions: ['developersManage'],
  },
]
