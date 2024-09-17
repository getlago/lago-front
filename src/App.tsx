import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import { StyledEngineProvider, ThemeProvider } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { DebugInfoDialog, DebugInfoDialogRef } from '~/components/DebugInfoDialog'
import { ToastContainer } from '~/components/designSystem/Toasts'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { RouteWrapper } from '~/components/RouteWrapper'
import { UserIdentifier } from '~/components/UserIdentifier'
import { envGlobalVar, initializeApolloClient, initializeTranslations } from '~/core/apolloClient'
import { initializeYup } from '~/formValidation/initializeYup'
import { useShortcuts } from '~/hooks/ui/useShortcuts'
import { theme } from '~/styles'

import { AppEnvEnum } from './core/constants/globalTypes'

const App = () => {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null)
  const debugInfoDialogRef = useRef<DebugInfoDialogRef>(null)
  const { appEnv } = envGlobalVar()

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
            <DebugInfoDialog ref={debugInfoDialogRef} />
          </ThemeProvider>
        </StyledEngineProvider>
      </ApolloProvider>
    </BrowserRouter>
  )
}

export default App
