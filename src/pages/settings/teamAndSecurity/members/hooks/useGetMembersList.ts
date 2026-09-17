import { ApolloError, gql } from '@apollo/client'

import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  GetMembersLazyQueryHookResult,
  GetMembersQuery,
  MemberForEditRoleForDialogFragmentDoc,
  useGetMembersLazyQuery,
} from '~/generated/graphql'

gql`
  fragment MembershipItemForMembershipSettings on Membership {
    id
    roles
    user {
      id
      email
    }
    organization {
      id
      name
    }
    ...MemberForEditRoleForDialog
  }

  query getMembers($page: Int, $limit: Int, $searchTerm: String, $roleIds: [ID!]) {
    memberships(page: $page, limit: $limit, searchTerm: $searchTerm, roleIds: $roleIds) {
      metadata {
        currentPage
        totalPages
        totalCount
        adminCount
      }
      collection {
        ...MembershipItemForMembershipSettings
      }
    }
  }

  ${MemberForEditRoleForDialogFragmentDoc}
`

type UseGetMembersListProps = {
  pageSize?: number
  page?: number
  roleIds?: string[]
}

type UseGetMembersListReturn = {
  getMembers: GetMembersLazyQueryHookResult[0]
  members: GetMembersQuery['memberships']['collection']
  metadata: GetMembersQuery['memberships']['metadata'] | undefined
  membersError: ApolloError | undefined
  membersLoading: boolean
  membersRefetch: GetMembersLazyQueryHookResult[1]['refetch']
  membersFetchMore: GetMembersLazyQueryHookResult[1]['fetchMore']
}

export const useGetMembersList = ({
  pageSize = DEFAULT_PAGE_SIZE,
  page = 1,
  roleIds,
}: UseGetMembersListProps = {}): UseGetMembersListReturn => {
  const [
    getMembers,
    {
      data: membersData,
      error: membersError,
      loading: membersLoading,
      refetch: membersRefetch,
      fetchMore: membersFetchMore,
    },
  ] = useGetMembersLazyQuery({
    variables: { limit: pageSize, page, roleIds },
    notifyOnNetworkStatusChange: true,
  })

  return {
    getMembers,
    members: membersData?.memberships.collection || [],
    metadata: membersData?.memberships.metadata,
    membersError,
    membersLoading,
    membersRefetch,
    membersFetchMore,
  }
}
