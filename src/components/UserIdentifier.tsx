import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'

import { addToast, updateCurrentUserInfosVar, resetCurrentUserInfosVar } from '~/core/apolloClient'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { useUserIdentifierQuery } from '~/generated/graphql'

gql`
  fragment CurrentOrganization on Organization {
    id
    name
    apiKey
  }

  fragment CurrentUser on User {
    id
    email
    organizations {
      ...CurrentOrganization
    }
  }

  query UserIdentifier {
    me: currentUser {
      ...CurrentUser
    }
  }
`

export const UserIdentifier = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const { data, refetch } = useUserIdentifierQuery()
  // If for some reason we constantly get null on the meQuery, avoid inifnite refetch
  const refetchCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isAuthenticated) {
      resetCurrentUserInfosVar()
      refetchCountRef.current = 0
    } else if (!data) {
      if (refetchCountRef.current <= 5) {
        refetch()
        refetchCountRef.current = refetchCountRef.current + 1
      } else {
        addToast({
          severity: 'danger',
          translateKey: 'text_622f7a3dc32ce100c46a5154',
        })
      }
    } else {
      updateCurrentUserInfosVar({ user: data?.me })
    }
  }, [data, isAuthenticated, refetch])

  return null
}
