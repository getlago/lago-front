import { Suspense } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import styled from 'styled-components'

import { routes, formatRoute } from '~/core/router'
import { I18nProvider, LocaleEnum } from '~/core/I18nContext'
import { Icon } from '~/components/designSystem'
import { theme } from '~/styles'
import { inputGlobalStyles } from '~/styles/globalStyle'

const RouteWrapper = () => {
  const loggedIn = false
  const formattedRoutes = routes.map((route) => formatRoute(route, loggedIn))
  let element = useRoutes(formattedRoutes)

  return (
    <Suspense
      fallback={
        <Loader>
          <Icon name="processing" color="info" size="large" animation="spin" />
        </Loader>
      }
    >
      {element}
    </Suspense>
  )
}

const App = () => {
  return (
    <BrowserRouter basename="/">
      <ThemeProvider theme={theme}>
        <I18nProvider locale={LocaleEnum.en}>{inputGlobalStyles}</I18nProvider>
        <RouteWrapper />
      </ThemeProvider>
    </BrowserRouter>
  )
}

const Loader = styled.div`
  height: 100%;
  width: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
`

export default App
