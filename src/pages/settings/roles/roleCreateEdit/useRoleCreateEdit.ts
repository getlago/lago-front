import { useLocation, useParams } from 'react-router-dom'

import { RoleCreateEditFormValues } from '../common/rolePermissionsForm/validationSchema'

export const useRoleCreateEdit = () => {
  const location = useLocation()
  const params = useParams()

  const roleIdFromEdition = params.roleId
  const roleIdFromDuplicate = new URLSearchParams(location.search).get('duplicate-from')

  const roleId = roleIdFromEdition || roleIdFromDuplicate || undefined

  const isEdition = !!roleIdFromEdition

  const updateRole = (formattedValues: RoleCreateEditFormValues) => {
    // Do nothing for now
    return formattedValues
  }

  const createRole = (formattedValues: RoleCreateEditFormValues) => {
    // Do nothing for now
    return formattedValues
  }

  const handleSave = async (formattedValues: RoleCreateEditFormValues) => {
    // Do nothing for now

    if (isEdition) {
      updateRole(formattedValues)
    }

    if (!isEdition) {
      createRole(formattedValues)
    }

    return {
      errors: [],
    }
  }

  return {
    roleId,
    isEdition,
    handleSave,
  }
}
