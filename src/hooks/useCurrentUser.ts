import { gql } from '@apollo/client'

import { CurrentUserInfosFragment, useGetCurrentUserInfosQuery } from '~/generated/graphql'

import { useIsAuthenticated } from './auth/useIsAuthenticated'

gql`
  fragment CurrentUserInfos on User {
    id
    email
    premium
    organizations {
      id
      name
      logoUrl
    }
  }
  query getCurrentUserInfos {
    currentUser {
      ...CurrentUserInfos
    }
  }
`

type UseCurrentUser = () => {
  isPremium: boolean
  loading: boolean
  currentUser?: CurrentUserInfosFragment
}

export const useCurrentUser: UseCurrentUser = () => {
  const { isAuthenticated } = useIsAuthenticated()

  const { data, loading } = useGetCurrentUserInfosQuery({
    canonizeResults: true,
    fetchPolicy: 'cache-first',
    skip: !isAuthenticated,
  })

  return {
    currentUser: data?.currentUser,
    isPremium: data?.currentUser.premium || false,
    loading: loading,
  }
}
