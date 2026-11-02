import { CreateRoleInput, PermissionEnum } from '~/generated/graphql'

import { PermissionName } from '../../permissionsTypes'
import { RoleCreateEditFormValues } from '../validationSchema'

export const mapFromFormToApi = (
  formValues: RoleCreateEditFormValues,
  displayedPermissions: Array<PermissionName>,
): CreateRoleInput => {
  const permissions = displayedPermissions
    .filter((permission) => formValues.permissions[permission])
    .map((permission) => PermissionEnum[permission])

  return {
    name: formValues.name,
    code: formValues.code,
    description: formValues.description,
    permissions,
  }
}
