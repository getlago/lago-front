import { FeatureFlagEnum } from '~/generated/graphql'
import { TMembershipPermissions } from '~/hooks/usePermissions'

import { isRouteAvailable } from './isRouteAvailable'

import { routes } from '../index'
import { CustomRouteObject } from '../types'

type RouteCandidate = {
  path: string
  route: CustomRouteObject
}

type PermissionRouteMap = Partial<Record<keyof TMembershipPermissions, RouteCandidate[]>>

/**
 * Recursively extracts view permission to route mappings from route configs.
 * Keeps every candidate route per permission, in route declaration order.
 */
const buildPermissionRouteMap = (
  routeConfigs: typeof routes,
  map: PermissionRouteMap = {},
): PermissionRouteMap => {
  for (const route of routeConfigs) {
    // Process children first (depth-first)
    if (route.children) {
      buildPermissionRouteMap(route.children, map)
    }

    // Skip routes without permissions or path
    if ((!route.permissions && !route.permissionsOr) || !route.path) continue

    // Get the first path if it's an array
    const routePath = Array.isArray(route.path) ? route.path[0] : route.path

    // Skip routes with dynamic params (e.g., :customerId) as they need context
    if (routePath.includes(':')) continue

    // Find view permissions in this route (check both AND and OR arrays)
    const andViewPermissions =
      route.permissions?.filter((p) => p.toLowerCase().includes('view')) || []
    const orViewPermissions =
      route.permissionsOr?.filter((p) => p.toLowerCase().includes('view')) || []
    const viewPermissions = [...andViewPermissions, ...orViewPermissions]

    for (const viewPermission of viewPermissions) {
      map[viewPermission] = [...(map[viewPermission] ?? []), { path: routePath, route }]
    }
  }

  return map
}

// Build the map once at module load
let cachedMap: PermissionRouteMap | null = null

export const getPermissionRouteMap = (): PermissionRouteMap => {
  if (!cachedMap) {
    cachedMap = buildPermissionRouteMap(routes)
  }
  return cachedMap
}

export const getRouteForPermission = (
  permission: keyof TMembershipPermissions | null,
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean,
): string | null => {
  if (!permission) return null

  const candidate = getPermissionRouteMap()[permission]?.find(({ route }) =>
    isRouteAvailable(route, hasFeatureFlag),
  )

  return candidate?.path ?? null
}

export const isRoutePathAvailable = (
  path: string,
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean,
): boolean => {
  const relativePath = path.replace(/^\//, '')
  const candidate = Object.values(getPermissionRouteMap())
    .flat()
    .find((routeCandidate) => routeCandidate?.path === relativePath)

  return !candidate || isRouteAvailable(candidate.route, hasFeatureFlag)
}
