import { Link, Outlet } from 'react-router-dom'
import { useApolloClient } from '@apollo/client'

import { useCurrentUserInfosVar, logOut } from '~/core/apolloClient'
import { Button } from '~/components/designSystem'

const Home = () => {
  const { user } = useCurrentUserInfosVar()
  const client = useApolloClient()

  return (
    <div>
      <h1>Home</h1>
      <h2>{user?.email}</h2>
      <Button onClick={() => logOut(client)}>Log Out</Button>

      <div>
        <Link to="/">Go to test2</Link>
      </div>
      <div>
        <Link to="/test2">Back</Link>
      </div>

      <Outlet />
    </div>
  )
}

export default Home
