import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ANALYTIC_ROUTE, CUSTOMERS_LIST_ROUTE } from '~/core/router'
import { usePermissions } from '~/hooks/usePermissions'

const Home = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()

  useEffect(() => {
    if (hasPermissions(['analyticsView'])) {
      navigate(ANALYTIC_ROUTE, { replace: true })
    } else {
      navigate(CUSTOMERS_LIST_ROUTE, { replace: true })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default Home
