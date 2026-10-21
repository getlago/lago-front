import { FeatureFlagEnum } from '~/generated/graphql'
import { TMembershipPermissions } from '~/hooks/usePermissions'

import { getOrganizationRouteRegistry, isRouteEntryAvailable } from './routeRegistry'

import { CustomRouteObject } from '../types'

const isViewPermission = (permission: keyof TMembershipPermissions): boolean =>
  permission.toLowerCase().includes('view')

const isGrantedByPermission = (
  route: CustomRouteObject,
  permission: keyof TMembershipPermissions,
): boolean =>
  !!route.permissions?.includes(permission) || !!route.permissionsOr?.includes(permission)

// Skips `:param` paths: Home has no context to fill them.
export const getRouteForPermission = (
  permission: keyof TMembershipPermissions | null,
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean,
): string | null => {
  if (!permission || !isViewPermission(permission)) return null

  const entry = getOrganizationRouteRegistry().find(
    (candidate) =>
      !candidate.path.includes(':') &&
      isGrantedByPermission(candidate.route, permission) &&
      isRouteEntryAvailable(candidate, hasFeatureFlag),
  )

  return entry?.path ?? null
}
