import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ANALYTIC_ROUTE } from '~/core/router'

const Home = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(ANALYTIC_ROUTE, { replace: true })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default Home
