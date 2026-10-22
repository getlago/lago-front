import { matchRoutes, RouteObject } from 'react-router'

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

type MatchableRoute = RouteObject & { source: CustomRouteObject }

// One object per path: `matchRoutes` needs string paths, our configs may hold an array.
const toMatchableRoutes = (routeConfigs: CustomRouteObject[]): MatchableRoute[] =>
  routeConfigs.flatMap((route): MatchableRoute[] => {
    if (route.index) return [{ index: true, source: route }]

    const children = route.children ? toMatchableRoutes(route.children) : undefined
    const routePaths = getRoutePaths(route)

    if (!routePaths.length) return [{ children, source: route }]

    return routePaths.map((path) => ({ path, children, source: route }))
  })

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

const findOrganizationScopeRoute = (): CustomRouteObject | undefined =>
  routes.find((route) => route.path === ORGANIZATION_SCOPE_PATH)

let cachedRegistry: RouteRegistryEntry[] | null = null
let cachedMatchableRoutes: MatchableRoute[] | null = null

/**
 * Every concrete route path under `:organizationSlug` (array paths expanded, splats
 * left out), relative to the organization, with the chain of routes wrapping it.
 */
export const getOrganizationRouteRegistry = (): RouteRegistryEntry[] => {
  if (!cachedRegistry) {
    const organizationRoute = findOrganizationScopeRoute()

    cachedRegistry = organizationRoute
      ? buildRegistry(organizationRoute.children ?? [], '', [organizationRoute], [])
      : []
  }

  return cachedRegistry
}

const getMatchableOrganizationRoutes = (): MatchableRoute[] => {
  if (!cachedMatchableRoutes) {
    cachedMatchableRoutes = toMatchableRoutes(findOrganizationScopeRoute()?.children ?? [])
  }

  return cachedMatchableRoutes
}

// A splat leaf is the in-app 404, so an unknown path resolves to no route.
export const findOrganizationRoute = (path: string): RouteRegistryEntry | undefined => {
  const organizationRoute = findOrganizationScopeRoute()
  const matches = matchRoutes(getMatchableOrganizationRoutes(), `/${stripLeadingSlash(path)}`)
  const leaf = matches?.at(-1)

  if (!organizationRoute || !matches || !leaf?.route.path || isSplatPath(leaf.route.path)) {
    return undefined
  }

  return {
    path: matches.reduce((joined, { route }) => joinPaths(joined, route.path ?? ''), ''),
    route: leaf.route.source,
    ancestors: [organizationRoute, ...matches.slice(0, -1).map(({ route }) => route.source)],
  }
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

export const isOrganizationRouteAvailable = (
  pattern: string,
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean,
): boolean => {
  const entry = getOrganizationRouteRegistry().find(
    ({ path }) => path === stripLeadingSlash(pattern),
  )

  return !!entry && isRouteEntryAvailable(entry, hasFeatureFlag)
}
