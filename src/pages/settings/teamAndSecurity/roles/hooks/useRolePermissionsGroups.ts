import { CheckboxGroup } from '~/components/form/GroupedCheckboxList'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { useGetPermissionGrouping } from './useGetPermissionGrouping'

import { allPermissions, featureFlagGatedPermissions } from '../common/permissionsConst'

export const useRolePermissionsGroups = (): { groups: CheckboxGroup[] } => {
  const { hasFeatureFlag } = useOrganizationInfos()

  const availablePermissions = allPermissions.filter((permission) => {
    const requiredFeatureFlag = featureFlagGatedPermissions[permission]

    return !requiredFeatureFlag || hasFeatureFlag(requiredFeatureFlag)
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
