import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { captureException } from '@sentry/react'
import { useEffect } from 'react'

import { listenToCrossTabLogOut, logOutFromOtherTab } from '~/core/apolloClient'

export const useCrossTabLogOut = (client: ApolloClient<NormalizedCacheObject> | null): void => {
  useEffect(() => {
    if (!client) return

    return listenToCrossTabLogOut(() => {
      logOutFromOtherTab(client).catch(captureException)
    })
  }, [client])
}
