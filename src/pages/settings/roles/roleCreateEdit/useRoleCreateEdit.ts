import { FetchResult, gql, useApolloClient } from '@apollo/client'
import { generatePath, useLocation, useNavigate, useParams } from 'react-router-dom'

import { addToast } from '~/core/apolloClient'
import { HOME_ROUTE, ROLE_DETAILS_ROUTE } from '~/core/router'
import {
  CreateRoleInput,
  CreateRoleMutation,
  EditRoleMutation,
  GetCurrentUserInfosDocument,
  UpdateRoleInput,
  useCreateRoleMutation,
  useEditRoleMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'

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
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [createRoleMutation] = useCreateRoleMutation()
  const [editRoleMutation] = useEditRoleMutation()

  const roleIdFromEdition = params.roleId
  const roleIdFromDuplicate = new URLSearchParams(location.search).get('duplicate-from')

  const roleId = roleIdFromEdition || roleIdFromDuplicate || undefined

  const isEdition = !!roleIdFromEdition

  const navigateToCorrectPageAfterSave = async (savedRoleId: string) => {
    // Be sure to have correct current user infos after role creation
    await client.refetchQueries({
      include: [GetCurrentUserInfosDocument],
    })

    if (!hasPermissions(['rolesView'])) {
      navigate(HOME_ROUTE)
      return
    }

    navigate(generatePath(ROLE_DETAILS_ROUTE, { roleId: savedRoleId }))
  }

  const createRole = async (roleParams: CreateRoleInput) => {
    return await createRoleMutation({
      variables: {
        input: roleParams,
      },
      onCompleted: async (data) => {
        if (!data.createRole?.id) return

        addToast({
          message: translate('text_1766158947598y30l6z5btl6'),
          severity: 'success',
        })

        await navigateToCorrectPageAfterSave(data.createRole.id)
      },
    })
  }

  const editRole = async (roleParams: UpdateRoleInput) => {
    return await editRoleMutation({
      variables: {
        input: roleParams,
      },
      onCompleted: async (data) => {
        if (!data.updateRole?.id) return

        addToast({
          message: translate('text_176615894759841ijqrfnb29'),
          severity: 'success',
        })

        await navigateToCorrectPageAfterSave(data.updateRole.id)
      },
    })
  }

  const handleSave = async (formattedValues: CreateRoleInput) => {
    if (isEdition) {
      // Don't want code from formattedValues here
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
