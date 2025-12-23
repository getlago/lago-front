import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  groupNameMapping,
  hiddenPermissions,
  permissionDescriptionMapping,
  permissionGroupMapping,
} from '~/pages/settings/roles/common/permissionsConst'
import { PermissionGrouping, PermissionName } from '~/pages/settings/roles/common/permissionsTypes'

export const useGetPermissionGrouping = (
  permissions: Array<PermissionName>,
): { permissionGrouping: PermissionGrouping } => {
  const { translate } = useInternationalization()

  const getPermissionDescription = (permissionName: PermissionName): string => {
    return translate(permissionDescriptionMapping[permissionName]) || permissionName
  }

  const getPermissionDisplayName = (permissionName: PermissionName): string => {
    if (permissionName.includes('View')) {
      return translate('text_1765891513411ia199l1kqvn')
    }

    if (permissionName.includes('Create')) {
      return translate('text_1765891513411mmvzq1dha2g')
    }

    if (permissionName.includes('Update')) {
      return translate('text_176589151341131hm375yt26')
    }

    if (permissionName.includes('Delete')) {
      return translate('text_17658915134117q3obpdiyp0')
    }

    if (permissionName.includes('Detach')) {
      return translate('text_17659019698052gwjaownm41')
    }

    if (permissionName.includes('Attach')) {
      return translate('text_1765901969805kxro9oyumce')
    }

    if (permissionName.includes('TopUp')) {
      return translate('text_17659019698057h2jzmj84xg')
    }

    if (permissionName.includes('Void')) {
      return translate('text_1765901969805bi8wpofb9am')
    }

    if (permissionName.includes('Manage')) {
      return translate('text_17659019698052jkqqh1plsj')
    }

    if (permissionName.includes('Send')) {
      return translate('text_1765902388230kbfr36xduhx')
    }

    if (permissionName.includes('Terminate')) {
      return translate('text_1765902396031jith7jlydpw')
    }

    return permissionName
  }

  const getPermissionGroupDisplayName = (groupKey: string): string => {
    return translate(groupNameMapping[groupKey]) || translate('text_636d86cd9fd41b93c35bf1c7') // 'Other'
  }

  const hiddenPermissionsSet = new Set(hiddenPermissions)
  const filteredPermissions = permissions.filter(
    (permission) => !hiddenPermissionsSet.has(permission),
  )
  const permissionsSet = new Set(filteredPermissions)
  const allMappedPermissions = new Set(Object.values(permissionGroupMapping).flat())
  const unmappedPermissions = filteredPermissions.filter(
    (permission) => !allMappedPermissions.has(permission),
  )

  const result = Object.entries(permissionGroupMapping).reduce<PermissionGrouping>(
    (acc, [groupKey, groupPermissions]) => {
      const matchingPermissions = groupPermissions.filter((permission) =>
        permissionsSet.has(permission),
      )

      const groupName = getPermissionGroupDisplayName(groupKey)

      acc[groupKey] = {
        name: groupKey,
        displayName: groupName,
        permissions: matchingPermissions.map((permission) => ({
          name: permission,
          displayName: getPermissionDisplayName(permission),
          description: getPermissionDescription(permission),
          isReadPermission: permission.endsWith('View'),
        })),
      }

      return acc
    },
    {},
  )

  if (unmappedPermissions.length > 0) {
    const groupName = getPermissionGroupDisplayName('other')

    result.other = {
      name: 'other',
      displayName: groupName,
      permissions: unmappedPermissions.map((permission) => ({
        name: permission,
        displayName: getPermissionDisplayName(permission),
        description: getPermissionDescription(permission),
        isReadPermission: permission.endsWith('View'),
      })),
    }
  }

  const permissionGrouping = Object.entries(result).reduce<PermissionGrouping>(
    (acc, [key, group]) => {
      if (group.permissions.length > 0) {
        acc[key] = group
      }
      return acc
    },
    {},
  )

  return {
    permissionGrouping,
  }
}
