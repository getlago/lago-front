import { ApolloError, gql, useApolloClient } from '@apollo/client'
import { useState } from 'react'

import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import {
  CreateInviteMutationHookResult,
  GetInvitesDocument,
  GetInvitesQuery,
  InviteItemForMembersSettingsFragmentDoc,
  LagoApiError,
  RevokeInviteMutationHookResult,
  UpdateInviteRoleMutationHookResult,
  useCreateInviteMutation,
  useRevokeInviteMutation,
  useUpdateInviteRoleMutation,
} from '~/generated/graphql'

gql`
  fragment InviteForEditRoleForDialog on Invite {
    id
    roles
    email
  }

  mutation createInvite($input: CreateInviteInput!) {
    createInvite(input: $input) {
      id
      token
      ...InviteItemForMembersSettings
    }
  }

  ${InviteItemForMembersSettingsFragmentDoc}

  mutation updateInviteRole($input: UpdateInviteInput!) {
    updateInvite(input: $input) {
      id
      ...InviteForEditRoleForDialog
    }
  }

  mutation revokeInvite($input: RevokeInviteInput!) {
    revokeInvite(input: $input) {
      id
    }
  }
`

export type UseInviteActionsParams = {
  onInviteNotFound?: () => void
}

type UseInviteActionsReturn = {
  inviteToken: string
  setInviteToken: (token: string) => void
  createInvite: CreateInviteMutationHookResult[0]
  createInviteError: ApolloError | undefined
  updateInviteRole: UpdateInviteRoleMutationHookResult[0]
  revokeInvite: RevokeInviteMutationHookResult[0]
}

export const useInviteActions = ({
  onInviteNotFound,
}: UseInviteActionsParams = {}): UseInviteActionsReturn => {
  const client = useApolloClient()
  const [inviteToken, setInviteToken] = useState<string>('')

  const handleInviteError = (error: ApolloError): void => {
    const isSilencedNotFound = error.graphQLErrors.some(
      (graphQLError) => graphQLError.extensions?.code === LagoApiError.NotFound,
    )

    if (!isSilencedNotFound) return

    if (hasDefinedGQLError('NotFound', error, 'invite')) {
      addToast({
        severity: 'danger',
        translateKey: 'text_1788431703232ovdpgmdftnt',
      })
      client.refetchQueries({ include: ['getInvites'] })
      onInviteNotFound?.()

      return
    }

    addToast({ severity: 'danger', translateKey: 'text_622f7a3dc32ce100c46a5154' })
  }

  const [createInvite, { error }] = useCreateInviteMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (res?.createInvite?.token) {
        setInviteToken(res.createInvite.token)
      }
    },
    update(cache, { data }) {
      if (!data?.createInvite) return

      const invitesData: GetInvitesQuery | null = cache.readQuery({
        query: GetInvitesDocument,
      })

      cache.writeQuery({
        query: GetInvitesDocument,
        data: {
          invites: {
            metadata: {
              ...invitesData?.invites?.metadata,
              totalCount: (invitesData?.invites?.metadata?.totalCount || 0) + 1,
            },
            collection: [data?.createInvite, ...(invitesData?.invites?.collection || [])],
          },
        },
      })
    },
  })

  const [updateInviteRole] = useUpdateInviteRoleMutation({
    context: { silentErrorCodes: [LagoApiError.NotFound] },
    onError: handleInviteError,
    onCompleted(res) {
      if (res?.updateInvite) {
        addToast({
          severity: 'success',
          translateKey: 'text_664f3562b7caf600e5246883',
        })
      }
    },
  })

  const [revokeInvite] = useRevokeInviteMutation({
    context: { silentErrorCodes: [LagoApiError.NotFound] },
    onError: handleInviteError,
    onCompleted(data) {
      if (data?.revokeInvite) {
        addToast({
          translateKey: 'text_63208c711ce25db781407523',
          severity: 'success',
        })
      }
    },
    refetchQueries: ['getInvites'],
  })

  return {
    inviteToken,
    setInviteToken,
    createInvite,
    createInviteError: error,
    updateInviteRole,
    revokeInvite,
  }
}
