import { FetchResult, gql } from '@apollo/client'
import { generatePath, useLocation, useNavigate, useParams } from 'react-router-dom'

import { addToast } from '~/core/apolloClient'
import { ROLE_DETAILS_ROUTE } from '~/core/router'
import {
  CreateRoleInput,
  CreateRoleMutation,
  EditRoleMutation,
  UpdateRoleInput,
  useCreateRoleMutation,
  useEditRoleMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation createRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
    }
  }

  mutation editRole($input: UpdateRoleInput!) {
    updateRole(input: $input) {
      id
    }
  }
`

export const useRoleCreateEdit = (): {
  roleId: string | undefined
  isEdition: boolean
  handleSave: (
    formattedValues: CreateRoleInput,
  ) => Promise<FetchResult<EditRoleMutation> | FetchResult<CreateRoleMutation>>
} => {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const { translate } = useInternationalization()

  const [createRoleMutation] = useCreateRoleMutation()
  const [editRoleMutation] = useEditRoleMutation()

  const roleIdFromEdition = params.roleId
  const roleIdFromDuplicate = new URLSearchParams(location.search).get('duplicate-from')

  const roleId = roleIdFromEdition || roleIdFromDuplicate || undefined

  const isEdition = !!roleIdFromEdition

  const createRole = async (roleParams: CreateRoleInput) => {
    return await createRoleMutation({
      variables: {
        input: roleParams,
      },
      onCompleted: (data) => {
        if (!data.createRole?.id) return

        navigate(generatePath(ROLE_DETAILS_ROUTE, { roleId: data.createRole.id }))

        addToast({
          message: translate('text_1766158947598y30l6z5btl6'),
          severity: 'success',
        })
      },
    })
  }

  const editRole = async (roleParams: UpdateRoleInput) => {
    return await editRoleMutation({
      variables: {
        input: roleParams,
      },
      onCompleted: (data) => {
        if (!data.updateRole?.id) return

        navigate(generatePath(ROLE_DETAILS_ROUTE, { roleId: data.updateRole.id }))

        addToast({
          message: translate('text_176615894759841ijqrfnb29'),
          severity: 'success',
        })
      },
    })
  }

  const handleSave = async (formattedValues: CreateRoleInput) => {
    // Do nothing for now

    if (isEdition) {
      // Don't want code here
      const formattedValuesForUpdate: UpdateRoleInput = {
        id: roleId as string,
        name: formattedValues.name,
        description: formattedValues.description,
        permissions: formattedValues.permissions,
      }

      return await editRole(formattedValuesForUpdate)
    }

    return await createRole(formattedValues)
  }

  return {
    roleId,
    isEdition,
    handleSave,
  }
}
