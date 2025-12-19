import { RoleItem } from '~/pages/settings/roles/common/roleTypes'

import { mapPermissionsFromRole } from './mapPermissionsFromRole'

export const mapFromApiToForm = (role: RoleItem | undefined) => {
  return {
    name: role ? role.name : '',
    description: role ? role.description : '',
    permissions: mapPermissionsFromRole(role),
  }
}
