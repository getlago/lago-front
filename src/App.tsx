import { BrowserRouter, Routes, useRoutes } from 'react-router-dom'
import { routes } from '~/core/router'

const RouteWrapper = () => {
  let element = useRoutes(routes)
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
