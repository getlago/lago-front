import { useApolloClient } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import {
  CUSTOMER_PORTAL_TOKEN_LS_KEY,
  getItemFromLS,
  onAccessCustomerPortal,
} from '~/core/apolloClient'
import CustomerPortal from '~/pages/customerPortal/CustomerPortal'

const PortalInit = () => {
  const { token } = useParams()
  const client = useApolloClient()

  useEffect(() => {
    if (token) {
      // Prevent active queries from "main" app to re-fetch
      client.clearStore()

      onAccessCustomerPortal(token)
    }
  }, [client, token])

  if (!token || !getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)) {
    return (
      <div className="flex size-full items-center justify-center">
        <Icon name="processing" color="info" size="large" animation="spin" />
      </div>
    )
  }

  return <CustomerPortal />
}

export default PortalInit
