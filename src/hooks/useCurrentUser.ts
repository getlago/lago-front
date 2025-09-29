import { gql } from '@apollo/client'
import { useMemo } from 'react'

import { getItemFromLS } from '~/core/apolloClient'
import { ORGANIZATION_LS_KEY_ID } from '~/core/constants/localStorageKeys'
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
        accessibleByCurrentSession
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
  refetchCurrentUserInfos: () => void
}

export const useCurrentUser: UseCurrentUser = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const currentOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)

  const {
    data,
    loading,
    refetch: refetchCurrentUserInfos,
  } = useGetCurrentUserInfosQuery({
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    skip: !isAuthenticated,
  })

  const currentMembership = useMemo(() => {
    return data?.currentUser?.memberships?.find(
      (membership) => membership.organization.id === currentOrganizationId,
    )
  }, [data?.currentUser?.memberships, currentOrganizationId])

  return {
    currentMembership,
    currentUser: data?.currentUser,
    isPremium: data?.currentUser.premium || false,
    loading: loading,
    refetchCurrentUserInfos,
  }
}
