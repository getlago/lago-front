import { CheckboxGroup } from '~/components/form/GroupedCheckboxList'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useGetPermissionGrouping } from './useGetPermissionGrouping'

import {
  allPermissions,
  featureFlagGatedPermissions,
  featureFlagHiddenPermissions,
} from '../common/permissionsConst'

export const useRolePermissionsGroups = (): { groups: CheckboxGroup[] } => {
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

  return { groups }
}
