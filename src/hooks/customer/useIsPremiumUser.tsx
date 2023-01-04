import { gql } from '@apollo/client'

import { useGetCurrentUserPremiumQuery } from '~/generated/graphql'

gql`
  query getCurrentUserPremium {
    currentUser {
      id
      premium
    }
  }
`

export const useIsPremiumUser = () => {
  const { data } = useGetCurrentUserPremiumQuery({
    canonizeResults: true,
    fetchPolicy: 'cache-first',
  })

  return data?.currentUser.premium || false
}
