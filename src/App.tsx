import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client'
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev'
import '@copilotkit/react-ui/styles.css'
import { StyledEngineProvider, ThemeProvider } from '@mui/material'
import { DesignSystemProvider } from 'lago-design-system'
import { useEffect, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'

import { AIAssistant } from '~/components/aiAssistant/AIAssistant'
import { ToastContainer } from '~/components/designSystem/Toasts'
import { DEVTOOL_ROUTE } from '~/components/developers/DevtoolsRouter'
import { DevtoolsView } from '~/components/developers/DevtoolsView'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { RouteWrapper } from '~/components/RouteWrapper'
import { UserIdentifier } from '~/components/UserIdentifier'
import { envGlobalVar, initializeApolloClient, initializeTranslations } from '~/core/apolloClient'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import { initializeYup } from '~/formValidation/initializeYup'
import { AIAssistantProvider } from '~/hooks/useAIAssistantTool'
import { DeveloperToolProvider, DEVTOOL_AUTO_SAVE_ID } from '~/hooks/useDeveloperTool'
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
    <ApolloProvider client={client}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <DesignSystemProvider>
            <ErrorBoundary>
              <PanelGroup direction="horizontal">
                <Panel>
                  <DeveloperToolProvider>
                    <PanelGroup direction="vertical" autoSaveId={DEVTOOL_AUTO_SAVE_ID}>
                      <Panel id="app-panel" order={1}>
                        <div className="h-full overflow-auto">
                          <BrowserRouter basename="/">
                            <RouteWrapper />
                          </BrowserRouter>
                        </div>
                      </Panel>
                      <MemoryRouter initialEntries={[DEVTOOL_ROUTE]}>
                        <DevtoolsView />
                      </MemoryRouter>
                    </PanelGroup>
                  </DeveloperToolProvider>
                </Panel>
                <AIAssistantProvider>
                  <AIAssistant />
                </AIAssistantProvider>
              </PanelGroup>
            </ErrorBoundary>
            <UserIdentifier />
            <ToastContainer />
          </DesignSystemProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </ApolloProvider>
  )
}

export default App
