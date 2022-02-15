import { BrowserRouter, useRoutes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'

import { routes, formatRoute } from '~/core/router'
import { theme } from '~/styles'

const RouteWrapper = () => {
  const loggedIn = false
  const formattedRoutes = routes.map((route) => formatRoute(route, loggedIn))
  let element = useRoutes(formattedRoutes)

  return element
}

const App = () => {
  return (
    <BrowserRouter basename="/">
      <ThemeProvider theme={theme}>
        <RouteWrapper />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
