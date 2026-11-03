import { useMemo } from 'react'

import { CheckboxGroup } from '~/components/form/GroupedCheckboxList'
import { isUsageGovernanceEnabled } from '~/core/utils/usageGovernance'
import { FeatureFlagEnum } from '~/generated/graphql'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useGetPermissionGrouping } from './useGetPermissionGrouping'

import {
  allPermissions,
  featureFlagGatedPermissions,
  featureFlagHiddenPermissions,
  usageGovernancePermissions,
} from '../common/permissionsConst'
import { PermissionName } from '../common/permissionsTypes'

const getAvailablePermissions = ({
  featureFlags,
  isUsageGovernanceAvailable,
}: {
  featureFlags: ReadonlyArray<FeatureFlagEnum>
  isUsageGovernanceAvailable: boolean
}): Array<PermissionName> =>
  allPermissions.filter((permission) => {
    const requiredFeatureFlag = featureFlagGatedPermissions[permission]
    const hidingFeatureFlag = featureFlagHiddenPermissions[permission]

    if (!isUsageGovernanceAvailable && usageGovernancePermissions.includes(permission)) return false
    if (requiredFeatureFlag && !featureFlags.includes(requiredFeatureFlag)) return false
    if (hidingFeatureFlag && featureFlags.includes(hidingFeatureFlag)) return false

    return true
  })

export const useRolePermissionsGroups = (): {
  groups: CheckboxGroup[]
  displayedPermissions: PermissionName[]
  isLoading: boolean
} => {
  const { organization, loading, hasFeatureFlag } = useOrganizationInfos()
  const featureFlags = organization?.featureFlags
  const isUsageGovernanceAvailable = isUsageGovernanceEnabled({ organization, hasFeatureFlag })

  const availablePermissions = useMemo(
    () => getAvailablePermissions({ featureFlags: featureFlags ?? [], isUsageGovernanceAvailable }),
    [featureFlags, isUsageGovernanceAvailable],
  )

  const { permissionGrouping } = useGetPermissionGrouping(availablePermissions)

  const groups = useMemo<CheckboxGroup[]>(
    () =>
      Object.values(permissionGrouping).map((permGroup) => ({
        id: permGroup.name,
        label: permGroup.displayName,
        items: permGroup.permissions.map((permission) => ({
          id: permission.name,
          label: permission.description,
        })),
      })),
    [permissionGrouping],
  )

  const displayedPermissions = useMemo(
    () => groups.flatMap((group) => group.items.map((item) => item.id as PermissionName)),
    [groups],
  )

  return { groups, displayedPermissions, isLoading: loading || !organization }
}
