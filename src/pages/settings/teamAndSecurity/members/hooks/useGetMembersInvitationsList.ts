import { gql } from '@apollo/client'

import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { InviteForEditRoleForDialogFragmentDoc, useGetInvitesQuery } from '~/generated/graphql'

gql`
  fragment InviteItemForMembersSettings on Invite {
    id
    email
    token
    roles
    organization {
      id
      name
    }
    ...InviteForEditRoleForDialog
  }

  query getInvites($page: Int, $limit: Int) {
    invites(page: $page, limit: $limit) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        ...InviteItemForMembersSettings
      }
    }
  }

  ${InviteForEditRoleForDialogFragmentDoc}
`

export const useGetMembersInvitationList = (pageSize: number = DEFAULT_PAGE_SIZE) => {
  const {
    data: invitesData,
    error: invitesError,
    loading: invitesLoading,
    refetch: invitesRefetch,
    fetchMore: invitesFetchMore,
  } = useGetInvitesQuery({ variables: { limit: pageSize }, notifyOnNetworkStatusChange: true })

  return {
    invitations: invitesData?.invites.collection || [],
    metadata: invitesData?.invites.metadata,
    invitesError,
    invitesLoading,
    invitesRefetch,
    invitesFetchMore,
  }
}
