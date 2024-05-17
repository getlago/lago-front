import { gql } from '@apollo/client'

import { getItemFromLS, ORGANIZATION_LS_KEY_ID } from '~/core/apolloClient'
import {
  CurrentUserInfosFragment,
  MembershipPermissionsFragmentDoc,
  useGetCurrentUserInfosQuery,
} from '~/generated/graphql'

import { useIsAuthenticated } from './auth/useIsAuthenticated'

gql`
  fragment CurrentUserInfos on User {
    id
    email
    premium
    memberships {
      id
      ...MembershipPermissions
      organization {
        id
        name
        logoUrl
      }
    }
  }

  query getCurrentUserInfos {
    currentUser {
      ...CurrentUserInfos
    }
  }

  ${MembershipPermissionsFragmentDoc}
`

type UseCurrentUser = () => {
  isPremium: boolean
  loading: boolean
  currentUser?: CurrentUserInfosFragment
  currentMembership?: CurrentUserInfosFragment['memberships'][0]
}

export const useCurrentUser: UseCurrentUser = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const currentOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)

  const { data, loading } = useGetCurrentUserInfosQuery({
    canonizeResults: true,
    fetchPolicy: 'cache-first',
    skip: !isAuthenticated,
  })

  return {
    currentUser: data?.currentUser,
    currentMembership: data?.currentUser.memberships.find(
      (membership) => membership.organization.id === currentOrganizationId,
    ),
    isPremium: data?.currentUser.premium || false,
    loading: loading,
  }
}
