import { gql } from '@apollo/client'

import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { MemberForEditRoleForDialogFragmentDoc, useGetMembersQuery } from '~/generated/graphql'

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

  query getMembers($page: Int, $limit: Int) {
    memberships(page: $page, limit: $limit) {
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

export const useGetMembersList = (pageSize: number = DEFAULT_PAGE_SIZE, page: number = 1) => {
  const {
    data: membersData,
    error: membersError,
    loading: membersLoading,
    refetch: membersRefetch,
    fetchMore: membersFetchMore,
  } = useGetMembersQuery({
    variables: { limit: pageSize, page },
    notifyOnNetworkStatusChange: true,
  })

  return {
    members: membersData?.memberships.collection || [],
    metadata: membersData?.memberships.metadata,
    membersError,
    membersLoading,
    membersRefetch,
    membersFetchMore,
  }
}
