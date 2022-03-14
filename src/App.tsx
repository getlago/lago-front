import { Suspense, useState, useEffect } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import styled from 'styled-components'
import { ApolloClient, NormalizedCacheObject, ApolloProvider } from '@apollo/client'

import { routes, formatRoute } from '~/core/router'
import { initializeApolloClient } from '~/core/apolloClient'
import { I18nProvider, LocaleEnum } from '~/core/I18nContext'
import { Icon } from '~/components/designSystem'
import { theme } from '~/styles'
import { UserIdentifier } from '~/components/UserIdentifier'
import { ToastContainer } from '~/components/designSystem/Toasts'
import { inputGlobalStyles } from '~/styles/globalStyle'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'
import { ErrorBoundary } from '~/components/ErrorBoundary'

const RouteWrapper = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const formattedRoutes = routes.map((route) => formatRoute(route, isAuthenticated))
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
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null)

  useEffect(() => {
    async function initApolloClient() {
      const apolloClient = await initializeApolloClient()

      setClient(apolloClient)
    }
    // eslint-disable-next-line no-console
    initApolloClient().catch((err) => console.error(err))
  }, [])

  if (!client) return null

  return (
    <BrowserRouter basename="/">
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <I18nProvider locale={LocaleEnum.en}>
            {inputGlobalStyles}
            <ErrorBoundary>
              <RouteWrapper />
            </ErrorBoundary>
            <UserIdentifier />
            <ToastContainer />
          </I18nProvider>
        </ThemeProvider>
      </ApolloProvider>
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
