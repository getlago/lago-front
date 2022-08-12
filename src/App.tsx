import { useState, useEffect, useRef } from 'react'
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
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { DebugInfoDialog, DebugInfoDialogRef } from '~/components/DebugInfoDialog'

const App = () => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null)
  const debugInfoDialogRef = useRef<DebugInfoDialogRef>(null)

  useShortcuts([
    {
      keys: ['Ctrl', 'KeyI'],
      action: () => debugInfoDialogRef.current?.openDialog(),
    },
  ])

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
          <DebugInfoDialog ref={debugInfoDialogRef} />
        </ThemeProvider>
      </ApolloProvider>
    </BrowserRouter>
  )
}

export default App
