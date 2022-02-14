import { BrowserRouter, useRoutes } from 'react-router-dom'
import { routes, formatRoute } from '~/core/router'

const RouteWrapper = () => {
  const loggedIn = false
  const formattedRoutes = routes.map((route) => formatRoute(route, loggedIn))

  let element = useRoutes(formattedRoutes)
  return element
}

const App = () => {
  return (
    <BrowserRouter basename="/">
      <RouteWrapper />
    </BrowserRouter>
  )
}

export default App
