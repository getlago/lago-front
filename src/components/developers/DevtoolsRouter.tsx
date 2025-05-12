import { useRoutes } from 'react-router-dom'

import { ApiKeys, Events, WebhookLogs, Webhooks } from '~/components/developers/views'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

export const API_KEYS_ROUTE = '/devtool'
export const WEBHOOKS_ROUTE = '/webhooks'
export const WEBHOOK_ROUTE = '/webhooks/:webhookId'
export const WEBHOOK_LOGS_ROUTE = '/webhooks/:webhookId/logs/:logId'
export const EVENTS_ROUTE = '/events'
export const EVENT_LOG_ROUTE = '/events/:eventId'

export const DevtoolsRouter = () => {
  const routes = useRoutes([
    { path: API_KEYS_ROUTE, element: <ApiKeys /> },
    {
      path: WEBHOOKS_ROUTE,
      element: <Webhooks />,
    },
    { path: WEBHOOK_ROUTE, element: <WebhookLogs /> },
    { path: WEBHOOK_LOGS_ROUTE, element: <WebhookLogs /> },
    { path: EVENTS_ROUTE, element: <Events /> },
    { path: EVENT_LOG_ROUTE, element: <Events /> },
    { path: '*', element: <ApiKeys /> },
  ])

  return routes
}

export const devToolsNavigationMapping = (
  translate: ReturnType<typeof useInternationalization>['translate'],
  hasPermissions: ReturnType<typeof usePermissions>['hasPermissions'],
) => {
  return [
    {
      title: translate('text_636df520279a9e1b3c68cc67'),
      link: API_KEYS_ROUTE,
      hidden: !hasPermissions(['developersKeysManage']),
    },
    {
      title: translate('text_6271200984178801ba8bdede'),
      link: WEBHOOKS_ROUTE,
      match: [WEBHOOKS_ROUTE, WEBHOOK_ROUTE, WEBHOOK_LOGS_ROUTE],
      hidden: !hasPermissions(['developersManage']),
    },
    {
      title: translate('text_6298bd525e359200d5ea0020'),
      link: EVENTS_ROUTE,
      match: [EVENTS_ROUTE, EVENT_LOG_ROUTE],
      hidden: !hasPermissions(['developersManage']),
    },
  ]
}
