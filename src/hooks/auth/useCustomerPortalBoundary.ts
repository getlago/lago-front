import { useApolloClient } from '@apollo/client'
import { captureException } from '@sentry/react'
import { useEffect } from 'react'

import { customerPortalTokenVar, onLeaveCustomerPortal } from '~/core/apolloClient'
import { useLocation } from '~/core/router/useLocation'
import { isCustomerPortalPath } from '~/core/router/utils/isCustomerPortalPath'

// Idempotent: `onLeaveCustomerPortal` drops the token a StrictMode replay reads back.
export const useCustomerPortalBoundary = (): void => {
  const client = useApolloClient()
  const { pathname } = useLocation()

  useEffect(() => {
    if (isCustomerPortalPath(pathname) || !customerPortalTokenVar()) return

    onLeaveCustomerPortal(client).catch(captureException)
  }, [client, pathname])
}
