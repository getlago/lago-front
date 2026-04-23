import { ApolloProvider } from '@apollo/client'
import { Outlet } from 'react-router-dom'

import { adminApolloClient } from '~/core/apolloClient/adminClient'

const AdminLayout = () => {
  return (
    <ApolloProvider client={adminApolloClient}>
      <Outlet />
    </ApolloProvider>
  )
}

export default AdminLayout
