import { customerObjectCreationRoutes, customerVoidRoutes } from '~/core/router/CustomerRoutes'
import { objectCreationRoutes } from '~/core/router/ObjectsRoutes'

/**
 * Transforms route definitions into an array of path objects for route matching.
 * Combines object creation routes, customer creation routes, and customer void routes
 * into a flat array of path objects that can be used with react-router's matchRoutes.
 * This is used to determine when the AI Agent component should be hidden.
 */
export const getObjectCreationPaths = (): Array<{ path: string }> => {
  return [...objectCreationRoutes, ...customerObjectCreationRoutes, ...customerVoidRoutes]
    ?.reduce((prev, curr) => prev.concat(curr.path ? curr.path : []), [] as string[])
    ?.map((path: string) => ({ path }))
}
