import { isUsageGovernanceEnabled } from '~/core/utils/usageGovernance'
import { FeatureFlagEnum, MainOrganizationInfosFragment } from '~/generated/graphql'

import { CustomRouteObject, OrganizationCapability } from '../types'

export const isRouteAvailable = (
  route: Pick<CustomRouteObject, 'featureFlag' | 'hiddenWithFeatureFlag'>,
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean,
): boolean => {
  if (route.featureFlag && !hasFeatureFlag(route.featureFlag)) return false
  if (route.hiddenWithFeatureFlag && hasFeatureFlag(route.hiddenWithFeatureFlag)) return false

  return true
}

const isRouteGatedByFeatureFlag = (
  route: Pick<CustomRouteObject, 'featureFlag' | 'hiddenWithFeatureFlag'>,
): boolean => !!route.featureFlag || !!route.hiddenWithFeatureFlag

export const isRouteGated = (
  route: Pick<
    CustomRouteObject,
    'featureFlag' | 'hiddenWithFeatureFlag' | 'requiresUsageGovernance' | 'organizationCapability'
  >,
): boolean =>
  isRouteGatedByFeatureFlag(route) ||
  !!route.requiresUsageGovernance ||
  !!route.organizationCapability

export type RouteGateOrganization = Pick<MainOrganizationInfosFragment, 'eventsStore'> &
  Partial<Pick<MainOrganizationInfosFragment, OrganizationCapability>>

export const isRouteUnlocked = ({
  route,
  hasFeatureFlag,
  organization,
}: {
  route: Pick<
    CustomRouteObject,
    'featureFlag' | 'hiddenWithFeatureFlag' | 'requiresUsageGovernance' | 'organizationCapability'
  >
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean
  organization?: RouteGateOrganization
}): boolean => {
  if (!isRouteAvailable(route, hasFeatureFlag)) return false
  if (route.organizationCapability && !organization?.[route.organizationCapability]) return false
  if (!route.requiresUsageGovernance) return true

  return isUsageGovernanceEnabled({ organization, hasFeatureFlag })
}
