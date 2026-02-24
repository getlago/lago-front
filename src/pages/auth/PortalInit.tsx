import { useApolloClient } from '@apollo/client'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Spinner } from '~/components/designSystem/Spinner'
import { onAccessCustomerPortal } from '~/core/apolloClient'
import CustomerPortal from '~/pages/customerPortal/CustomerPortal'

const PortalInit = () => {
  const { token } = useParams()
  const client = useApolloClient()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (token) {
      // Clear the Apollo cache before rendering the portal to prevent stale data
      // from previous sessions (e.g. null customerPortalUser from an expired token)
      // from being served by cache-first queries.
      client
        .clearStore()
        .catch(() => {})
        .finally(() => {
          onAccessCustomerPortal(token)
          setIsReady(true)
        })
    }
  }, [client, token])

  if (!token || !isReady) {
    return <Spinner />
  }

  return <CustomerPortal />
}

export default PortalInit
