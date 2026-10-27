import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { captureException } from '@sentry/react'
import { useEffect } from 'react'

import { listenToCrossTabLogOut, logOut } from '~/core/apolloClient'

export const useCrossTabLogOut = (client: ApolloClient<NormalizedCacheObject> | null): void => {
  useEffect(() => {
    if (!client) return

    return listenToCrossTabLogOut(() => {
      // `true` resets the location history, like the in-app logout this mirrors:
      // the next user must not reach the previous one's pages through it.
      logOut(client, true).catch(captureException)
    })
  }, [client])
}
