import { lazy } from 'react'

import { CustomRouteObject } from './types'

// ----------- Layouts -----------
const Developers = lazy(
  () => import(/* webpackChunkName: 'developers-layout' */ '~/layouts/Developers')
)
// ----------- Pages -----------

const ApiKeys = lazy(() => import(/* webpackChunkName: 'api-keys' */ '~/pages/developers/ApiKeys'))
const Webhook = lazy(() => import(/* webpackChunkName: 'webhook' */ '~/pages/developers/Webhook'))
const WebhookLogs = lazy(
  () => import(/* webpackChunkName: 'webhook-logs' */ '~/pages/developers/WebhookLogs')
)
const Debugger = lazy(
  () => import(/* webpackChunkName: 'api-keys' */ '~/pages/developers/Debugger')
)

// ----------- Routes -----------
// Developers routes
export const DEVELOPERS_ROUTE = '/developers'
export const API_KEYS_ROUTE = `${DEVELOPERS_ROUTE}/api-keys`
export const WEBHOOK_ROUTE = `${DEVELOPERS_ROUTE}/webhook`
export const WEBHOOK_LOGS_ROUTE = `${DEVELOPERS_ROUTE}/webhook/logs`
export const WEBHOOK_LOGS_TAB_ROUTE = `${DEVELOPERS_ROUTE}/webhook/logs/:tab`
export const DEBUGGER_ROUTE = `${DEVELOPERS_ROUTE}/debugger`

export const developperRoutes: CustomRouteObject[] = [
  {
    private: true,
    element: <Developers />,
    children: [
      {
        path: [API_KEYS_ROUTE, DEVELOPERS_ROUTE],
        private: true,
        element: <ApiKeys />,
      },
      {
        path: WEBHOOK_ROUTE,
        private: true,
        element: <Webhook />,
      },
      {
        path: DEBUGGER_ROUTE,
        private: true,
        element: <Debugger />,
      },
    ],
  },
  {
    private: true,
    path: [WEBHOOK_LOGS_ROUTE, WEBHOOK_LOGS_TAB_ROUTE],
    element: <WebhookLogs />,
  },
]
