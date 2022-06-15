import { useState, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material'
import { ApolloClient, NormalizedCacheObject, ApolloProvider } from '@apollo/client'

import { initializeApolloClient, initializeTranslations } from '~/core/apolloClient'
import { theme } from '~/styles'
import { UserIdentifier } from '~/components/UserIdentifier'
import { ToastContainer } from '~/components/designSystem/Toasts'
import { inputGlobalStyles } from '~/styles/globalStyle'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { RouteWrapper } from '~/components/RouteWrapper'

const App = () => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null)

  useEffect(() => {
    async function initApolloClient() {
      const apolloClient = await initializeApolloClient()

      setClient(apolloClient)
    }
    // eslint-disable-next-line no-console
    initApolloClient().catch((err) => console.error(err))
    initializeTranslations()
  }, [])

  if (!client) return null

  return (
    <BrowserRouter basename="/">
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          {inputGlobalStyles}
          <ErrorBoundary>
            <RouteWrapper />
          </ErrorBoundary>
          <UserIdentifier />
          <ToastContainer />
        </ThemeProvider>
      </ApolloProvider>
    </BrowserRouter>
  )
}

export default App
