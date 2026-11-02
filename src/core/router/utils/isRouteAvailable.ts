import { FeatureFlagEnum } from '~/generated/graphql'

import { CustomRouteObject } from '../types'

export const isRouteAvailable = (
  route: Pick<CustomRouteObject, 'featureFlag' | 'hiddenWithFeatureFlag'>,
  hasFeatureFlag: (flag: FeatureFlagEnum) => boolean,
): boolean => {
  if (route.featureFlag && !hasFeatureFlag(route.featureFlag)) return false
  if (route.hiddenWithFeatureFlag && hasFeatureFlag(route.hiddenWithFeatureFlag)) return false

  return true
}

export const isRouteGatedByFeatureFlag = (
  route: Pick<CustomRouteObject, 'featureFlag' | 'hiddenWithFeatureFlag'>,
): boolean => !!route.featureFlag || !!route.hiddenWithFeatureFlag
