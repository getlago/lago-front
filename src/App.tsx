import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { StyledEngineProvider, ThemeProvider } from '@mui/material'
import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { ToastContainer } from '~/components/designSystem/Toasts'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { RouteWrapper } from '~/components/RouteWrapper'
import { UserIdentifier } from '~/components/UserIdentifier'
import { envGlobalVar, initializeApolloClient, initializeTranslations } from '~/core/apolloClient'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { initializeYup } from '~/formValidation/initializeYup'
import { theme } from '~/styles'

const App = () => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null)
  const { appEnv } = envGlobalVar()

  useEffect(() => {
    async function initApolloClient() {
      const apolloClient = await initializeApolloClient()

      setClient(apolloClient)
    }
    // eslint-disable-next-line no-console
    initApolloClient().catch((err) => console.error(err))
    initializeTranslations()
    initializeYup()
  }, [])

  // Adds explicit apollo messages only in a dev environment
  if (appEnv === AppEnvEnum.development) {
    loadDevMessages()
    loadErrorMessages()
  }

  if (!client) return null

  return (
    <BrowserRouter basename="/">
      <ApolloProvider client={client}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <ErrorBoundary>
              <RouteWrapper />
            </ErrorBoundary>
            <UserIdentifier />
            <ToastContainer />
          </ThemeProvider>
        </StyledEngineProvider>
      </ApolloProvider>
    </BrowserRouter>
  )
}

export default App
