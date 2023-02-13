import { gql } from '@apollo/client'

import { useGetCurrentUserInfosQuery, CurrentUserInfosFragment } from '~/generated/graphql'

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
  currentUser?: CurrentUserInfosFragment
}

export const useCurrentUser: UseCurrentUser = () => {
  const { data } = useGetCurrentUserInfosQuery({
    canonizeResults: true,
    fetchPolicy: 'cache-first',
  })

  return {
    currentUser: data?.currentUser,
    isPremium: data?.currentUser.premium || false,
  }
}
