import { gql } from '@apollo/client'
import { getCurrentScope } from '@sentry/react'
import { Settings } from 'luxon'
import { useEffect, useRef } from 'react'

import { addToast } from '~/core/apolloClient'
import { getTimezoneConfig } from '~/core/timezone'
import {
  CurrentUserInfosFragmentDoc,
  MainOrganizationInfosFragmentDoc,
  useUserIdentifierQuery,
} from '~/generated/graphql'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'

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
  const { data, refetch } = useUserIdentifierQuery({ skip: !isAuthenticated })
  // If for some reason we constantly get null on the meQuery, avoid inifnite refetch
  const refetchCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isAuthenticated) {
      refetchCountRef.current = 0
      getCurrentScope().setUser(null)
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
      const { id, email } = data?.me || {}

      Settings.defaultZone = getTimezoneConfig(data?.organization?.timezone).name

      getCurrentScope().setUser({ id, email: email || undefined })
    }
  }, [data, isAuthenticated, refetch])

  return null
}
