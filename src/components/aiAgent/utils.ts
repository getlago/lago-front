import {
  customerPortalChildrenRoutes,
  customerPortalRoutes,
} from '~/core/router/CustomerPortalRoutes'
import { customerObjectCreationRoutes, customerVoidRoutes } from '~/core/router/CustomerRoutes'
import { ERROR_404_ROUTE, FORBIDDEN_ROUTE } from '~/core/router/index'
import { objectCreationRoutes } from '~/core/router/ObjectsRoutes'
import { quotesModificationRoutes } from '~/core/router/QuotesRoutes'
import { settingsObjectCreationRoutes } from '~/core/router/SettingRoutes'

/**
 * Transforms route definitions into an array of path objects for route matching.
 * Combines object creation routes, customer creation routes, customer void routes,
 * customer portal routes and error routes into a flat array of path objects that can be used with react-router's matchRoutes.
 * This is used to determine when the AI Agent component should be hidden.
 */
export const getHiddenAiAgentPaths = (): Array<{ path: string }> => {
  const routePaths = [
    ...objectCreationRoutes,
    ...customerObjectCreationRoutes,
    ...customerVoidRoutes,
    ...settingsObjectCreationRoutes,
    ...customerPortalRoutes,
    ...customerPortalChildrenRoutes,
    ...quotesModificationRoutes,
  ]
    ?.reduce((prev, curr) => prev.concat(curr.path ? curr.path : []), [] as string[])
    ?.map((path: string) => ({ path }))

  return [...routePaths, { path: ERROR_404_ROUTE }, { path: FORBIDDEN_ROUTE }]
}

export const humanizeToolCallName = (name: string): string => {
  const words = name.split('_').filter(Boolean).join(' ')

  return words.charAt(0).toUpperCase() + words.slice(1)
}

// Nested values are shown as indented JSON so the member sees exactly what will be sent
export const formatToolCallArguments = (
  toolArguments: unknown,
): Array<{ key: string; label: string; value: string }> => {
  if (!toolArguments || typeof toolArguments !== 'object' || Array.isArray(toolArguments)) {
    return []
  }

  return Object.entries(toolArguments as Record<string, unknown>).map(([key, value]) => ({
    key,
    label: humanizeToolCallName(key),
    value:
      value !== null && typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
  }))
}
