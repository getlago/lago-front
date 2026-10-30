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

// Blank strings are quoted so a write that empties a field shows it
const formatToolCallValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim() ? value : JSON.stringify(value)
  }

  return String(value)
}

export const formatToolCallArguments = (
  toolArguments: unknown,
  rawArgumentsLabel: string,
): Array<{ key: string; label: string; value: string; isJson: boolean }> => {
  if (toolArguments === null || toolArguments === undefined) {
    return []
  }

  if (typeof toolArguments !== 'object' || Array.isArray(toolArguments)) {
    return [
      {
        key: 'arguments',
        label: rawArgumentsLabel,
        value: JSON.stringify(toolArguments, null, 2),
        isJson: true,
      },
    ]
  }

  return Object.entries(toolArguments as Record<string, unknown>).map(([key, value]) => {
    const isJson = value !== null && typeof value === 'object'

    return {
      key,
      label: humanizeToolCallName(key),
      value: isJson ? JSON.stringify(value, null, 2) : formatToolCallValue(value),
      isJson,
    }
  })
}
