import { matchPath } from 'react-router'

import { FeatureFlagEnum } from '~/generated/graphql'

import { isRouteAvailable } from './isRouteAvailable'
import { stripLeadingSlash } from './makeRelative'

import { routes } from '../index'
import { CustomRouteObject } from '../types'

const ORGANIZATION_SCOPE_PATH = ':organizationSlug'

export type RouteRegistryEntry = {
  path: string
  route: CustomRouteObject
  ancestors: CustomRouteObject[]
}

const getRoutePaths = (route: CustomRouteObject): string[] => {
  if (!route.path) return []

  return Array.isArray(route.path) ? route.path : [route.path]
}

const joinPaths = (parentPath: string, path: string): string =>
  [parentPath, path].filter(Boolean).join('/')

const isSplatPath = (path: string): boolean => path === '*' || path.endsWith('/*')

const countDynamicSegments = (path: string): number =>
  path.split('/').filter((segment) => segment.startsWith(':')).length

const buildRegistry = (
  routeConfigs: CustomRouteObject[],
  parentPath: string,
  ancestors: CustomRouteObject[],
  registry: RouteRegistryEntry[],
): RouteRegistryEntry[] => {
  for (const route of routeConfigs) {
    const routePaths = getRoutePaths(route)
    const branchPaths = routePaths.length
      ? routePaths.map((routePath) => joinPaths(parentPath, routePath))
      : [parentPath]

    for (const branchPath of branchPaths) {
      if (routePaths.length && !isSplatPath(branchPath)) {
        registry.push({ path: branchPath, route, ancestors })
      }

      if (route.children) {
        buildRegistry(route.children, branchPath, [...ancestors, route], registry)
      }
    }
  }

  return registry
}

let cachedRegistry: RouteRegistryEntry[] | null = null

/**
 * Every concrete route path under `:organizationSlug` (array paths expanded, splats
 * left out), relative to the organization, with the chain of routes wrapping it.
 */
export const getOrganizationRouteRegistry = (): RouteRegistryEntry[] => {
  if (!cachedRegistry) {
    const organizationRoute = routes.find((route) => route.path === ORGANIZATION_SCOPE_PATH)

    cachedRegistry = organizationRoute
      ? buildRegistry(organizationRoute.children ?? [], '', [organizationRoute], [])
      : []
  }

  return cachedRegistry
}

export const findOrganizationRoute = (path: string): RouteRegistryEntry | undefined => {
  const pathname = `/${stripLeadingSlash(path)}`

  return getOrganizationRouteRegistry()
    .filter((entry) => matchPath({ path: `/${entry.path}`, end: true }, pathname))
    .sort((a, b) => countDynamicSegments(a.path) - countDynamicSegments(b.path))[0]
}

export const isRouteEntryAvailable = (
  entry: RouteRegistryEntry,
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean,
): boolean =>
  [...entry.ancestors, entry.route].every((route) => isRouteAvailable(route, hasFeatureFlag))

export const isOrganizationPathAvailable = (
  path: string,
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean,
): boolean => {
  const entry = findOrganizationRoute(path)

  return !!entry && isRouteEntryAvailable(entry, hasFeatureFlag)
}
