import { gql } from '@apollo/client'
import { useEffect, useRef } from 'react'
import * as Sentry from '@sentry/browser'

import { addToast } from '~/core/apolloClient'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import {
  useUserIdentifierQuery,
  MainOrganizationInfosFragmentDoc,
  CurrentUserInfosFragmentDoc,
} from '~/generated/graphql'

gql`
  query UserIdentifier {
    me: currentUser {
      id
      email
      ...CurrentUserInfos
    }
    organization {
      ...MainOrganizationInfos
    }
  }

  ${MainOrganizationInfosFragmentDoc}
  ${CurrentUserInfosFragmentDoc}
`

export const UserIdentifier = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const { data, refetch } = useUserIdentifierQuery()
  // If for some reason we constantly get null on the meQuery, avoid inifnite refetch
  const refetchCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isAuthenticated) {
      refetchCountRef.current = 0
      Sentry.configureScope((scope) => scope.setUser(null))
    } else if (!data) {
      if (refetchCountRef.current <= 3) {
        refetch()
        refetchCountRef.current = refetchCountRef.current + 1
      } else {
        addToast({
          severity: 'danger',
          translateKey: 'text_622f7a3dc32ce100c46a5154',
        })
      }
    } else {
      const { id, email } = data?.me

      Sentry.configureScope((scope) => scope.setUser({ id, email: email || undefined }))
    }
  }, [data, isAuthenticated, refetch])

  return null
}
