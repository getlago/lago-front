import { ApolloError, gql } from '@apollo/client'

import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  GetInvitesLazyQueryHookResult,
  GetInvitesQuery,
  InviteForEditRoleForDialogFragmentDoc,
  useGetInvitesLazyQuery,
} from '~/generated/graphql'

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

  query getInvites($page: Int, $limit: Int, $searchTerm: String, $roleIds: [ID!]) {
    invites(page: $page, limit: $limit, searchTerm: $searchTerm, roleIds: $roleIds) {
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

type UseGetMembersInvitationListProps = {
  pageSize?: number
  page?: number
  roleIds?: string[]
}

type UseGetMembersInvitationListReturn = {
  getInvites: GetInvitesLazyQueryHookResult[0]
  invitations: GetInvitesQuery['invites']['collection']
  metadata: GetInvitesQuery['invites']['metadata'] | undefined
  invitesError: ApolloError | undefined
  invitesLoading: boolean
  invitesRefetch: GetInvitesLazyQueryHookResult[1]['refetch']
  invitesFetchMore: GetInvitesLazyQueryHookResult[1]['fetchMore']
}

export const useGetMembersInvitationList = ({
  pageSize = DEFAULT_PAGE_SIZE,
  page = 1,
  roleIds,
}: UseGetMembersInvitationListProps = {}): UseGetMembersInvitationListReturn => {
  const [
    getInvites,
    {
      data: invitesData,
      error: invitesError,
      loading: invitesLoading,
      refetch: invitesRefetch,
      fetchMore: invitesFetchMore,
    },
  ] = useGetInvitesLazyQuery({
    variables: { limit: pageSize, page, roleIds },
    notifyOnNetworkStatusChange: true,
  })

  return {
    getInvites,
    invitations: invitesData?.invites.collection || [],
    metadata: invitesData?.invites.metadata,
    invitesError,
    invitesLoading,
    invitesRefetch,
    invitesFetchMore,
  }
}
