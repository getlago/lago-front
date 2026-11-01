import { CheckboxGroup } from '~/components/form/GroupedCheckboxList'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useGetPermissionGrouping } from './useGetPermissionGrouping'

import {
  allPermissions,
  featureFlagGatedPermissions,
  featureFlagHiddenPermissions,
} from '../common/permissionsConst'
import { PermissionName } from '../common/permissionsTypes'

export const useRolePermissionsGroups = (): {
  groups: CheckboxGroup[]
  displayedPermissions: PermissionName[]
} => {
  const { hasFeatureFlag } = useOrganizationInfos()

  const availablePermissions = allPermissions.filter((permission) => {
    const requiredFeatureFlag = featureFlagGatedPermissions[permission]
    const hidingFeatureFlag = featureFlagHiddenPermissions[permission]

    if (requiredFeatureFlag && !hasFeatureFlag(requiredFeatureFlag)) return false
    if (hidingFeatureFlag && hasFeatureFlag(hidingFeatureFlag)) return false

    return true
  })

  const { permissionGrouping } = useGetPermissionGrouping(availablePermissions)

  // permissionGrouping already has translated displayName and descriptions
  const groups: CheckboxGroup[] = Object.values(permissionGrouping).map((permGroup) => ({
    id: permGroup.name,
    label: permGroup.displayName,
    items: permGroup.permissions.map((permission) => ({
      id: permission.name,
      label: permission.description, // Already translated by useGetPermissionGrouping
    })),
  }))

  const displayedPermissions = groups.flatMap((group) =>
    group.items.map((item) => item.id as PermissionName),
  )

  return { groups, displayedPermissions }
}
