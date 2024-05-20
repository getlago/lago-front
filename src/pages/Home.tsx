import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ANALYTIC_ROUTE, CUSTOMERS_LIST_ROUTE } from '~/core/router'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

const Home = () => {
  const navigate = useNavigate()
  const { loading: isUserLoading } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  useEffect(() => {
    // Make sure user permissions are loaded before performing redirection
    if (!isUserLoading) {
      if (hasPermissions(['analyticsView'])) {
        navigate(ANALYTIC_ROUTE, { replace: true })
      } else {
        navigate(CUSTOMERS_LIST_ROUTE, { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading])

  return null
}

export default Home
