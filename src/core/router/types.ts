import type { RouteObject } from 'react-router'

import { FeatureFlagEnum, MainOrganizationInfosFragment } from '~/generated/graphql'
import { TMembershipPermissions } from '~/hooks/usePermissions'

// What the API serves to an organization, beyond its feature flags.
export type OrganizationCapability = keyof Pick<
  MainOrganizationInfosFragment,
  'realtimeUsageEnabled'
>

export interface CustomRouteObject extends Omit<RouteObject, 'children' | 'path'> {
  path?: string | string[]
  private?: boolean
  onlyPublic?: boolean
  redirect?: string
  children?: CustomRouteObject[]
  permissions?: Array<keyof TMembershipPermissions> // AND logic (all must be true)
  permissionsOr?: Array<keyof TMembershipPermissions> // OR logic (at least one must be true)
  featureFlag?: FeatureFlagEnum
  organizationCapability?: OrganizationCapability
  hiddenWithFeatureFlag?: FeatureFlagEnum
}
