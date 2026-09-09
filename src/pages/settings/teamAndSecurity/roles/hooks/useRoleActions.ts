import { ApolloError, gql, useApolloClient } from '@apollo/client'
import { generatePath } from 'react-router-dom'

import { addToast } from '~/core/apolloClient'
import {
  ROLE_CREATE_ROUTE,
  ROLE_EDIT_ROUTE,
  TEAM_AND_SECURITY_GROUP_ROUTE,
  useNavigate,
} from '~/core/router'
import { DestroyRoleInput, GetRolesListDocument, useDeleteRoleMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { teamAndSecurityGroupOptions } from '../../common/teamAndSecurityConst'

gql`
  mutation deleteRole($input: DestroyRoleInput!) {
    destroyRole(input: $input) {
      id
    }
  }
`

export const useRoleActions = (): {
  deleteRole: (roleParams: DestroyRoleInput) => Promise<void>
  isDeletingRole: boolean
  deleteRoleError: ApolloError | undefined
  getDuplicateRolePath: (roleId: string) => string
  getEditRolePath: (roleId: string) => string
  navigateToDuplicate: (roleId: string) => void
  navigateToEdit: (roleId: string) => void
} => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const client = useApolloClient()

  const [deleteRoleMutation, { loading: isDeletingRole, error: deleteRoleError }] =
    useDeleteRoleMutation()

  const deleteRole = async (roleParams: DestroyRoleInput) => {
    const result = await deleteRoleMutation({
      variables: {
        input: roleParams,
      },
    })

    if (!result.data?.destroyRole?.id) return

    // Manually refetch since using refetchQueries wasn't working
    await client.refetchQueries({
      include: [GetRolesListDocument],
    })

    navigate(
      generatePath(TEAM_AND_SECURITY_GROUP_ROUTE, {
        group: teamAndSecurityGroupOptions.roles,
      }),
    )

    addToast({
      message: translate('text_1766158947598m8ut1nw2vjq'),
      severity: 'success',
    })
  }

  const getDuplicateRolePath = (roleId: string) => {
    const query = `duplicate-from=${roleId}`

    return generatePath(ROLE_CREATE_ROUTE, {
      search: query,
    })
  }
  const getEditRolePath = (roleId: string) => generatePath(ROLE_EDIT_ROUTE, { roleId })

  const navigateToDuplicate = (roleId: string) => {
    navigate(getDuplicateRolePath(roleId))
  }
  const navigateToEdit = (roleId: string) => {
    navigate(getEditRolePath(roleId))
  }

  return {
    deleteRole,
    isDeletingRole,
    deleteRoleError,
    getDuplicateRolePath,
    getEditRolePath,
    navigateToDuplicate,
    navigateToEdit,
  }
}
