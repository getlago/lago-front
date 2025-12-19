import { allPermissions } from '~/pages/settings/roles/common/permissionsConst'
import { PermissionName } from '~/pages/settings/roles/common/permissionsTypes'
import { RoleItem } from '~/pages/settings/roles/common/roleTypes'

export const mapPermissionsFromRole = (
  role: RoleItem | undefined,
): Record<PermissionName, boolean> => {
  return allPermissions.reduce<Record<string, boolean>>((acc, permissionName) => {
    acc[permissionName] = role ? role.permissions.includes(permissionName) || role.admin : false

    return acc
  }, {})
}
