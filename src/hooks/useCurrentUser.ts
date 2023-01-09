import { gql } from '@apollo/client'

import { useGetCurrentUserInfosQuery } from '~/generated/graphql'

gql`
  query getCurrentUserInfos {
    currentUser {
      id
      email
      organizations {
        id
        name
        logoUrl
      }
    }
  }
`

export const useCurrentUser = () => {
  const { data } = useGetCurrentUserInfosQuery({
    canonizeResults: true,
    fetchPolicy: 'cache-first',
  })
}
