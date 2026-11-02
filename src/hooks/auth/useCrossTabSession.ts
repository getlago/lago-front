import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { captureException } from '@sentry/react'
import { useEffect } from 'react'

import { listenToSessionChanges, reconcileSession } from '~/core/apolloClient'

export const useCrossTabSession = (client: ApolloClient<NormalizedCacheObject> | null): void => {
  useEffect(() => {
    if (!client) return

    const reconcile = (): void => {
      reconcileSession(client).catch(captureException)
    }

    // A change made while this tab was still booting fired before the listener existed.
    reconcile()

    return listenToSessionChanges(reconcile)
  }, [client])
}
