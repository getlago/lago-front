import { tw } from 'lago-design-system'
import { Panel, PanelResizeHandle } from 'react-resizable-panels'

import { NavigationBar } from '~/components/aiAgent/NavigationBar'
import { PanelAiAgent } from '~/components/aiAgent/PanelAiAgent'
import { PanelWrapper } from '~/components/aiAgent/PanelWrapper'
import { FeatureFlags, isFeatureFlagActive } from '~/core/utils/featureFlags'
import { AIPanelEnum, PANEL_CLOSED, PANEL_OPEN, useAiAgent } from '~/hooks/aiAgent/useAiAgent'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

export const AiAgent = () => {
  const { panelRef, currentPanelOpened, panelOpen, state, resetConversation } = useAiAgent()
  const { currentUser } = useCurrentUser()
  const { translate } = useInternationalization()

  const hasAccessToAiAgent = isFeatureFlagActive(FeatureFlags.AI_AGENT)

  if (!currentUser || !hasAccessToAiAgent) {
    return null
  }

  const shouldDisplayWelcomeMessage = !state.messages.length

  return (
    <>
      <div className="relative">
        <div className="h-screen w-12 bg-white shadow-l">
          <div className="absolute rotate-90-tl">
            <NavigationBar />
          </div>
        </div>
      </div>

      <PanelResizeHandle />
      <Panel
        id="ai-panel"
        ref={panelRef}
        defaultSize={PANEL_CLOSED}
        minSize={PANEL_CLOSED}
        maxSize={PANEL_OPEN}
        className={tw(panelOpen ? 'min-w-[360px]' : 'min-w-[0px]', 'shadow-l')}
      >
        {currentPanelOpened === AIPanelEnum.ai && (
          <PanelWrapper
            title={state.messages[0]?.message ?? translate('text_175741722585199myqwj6vyw')}
            isBeta={shouldDisplayWelcomeMessage}
            onBackButton={
              shouldDisplayWelcomeMessage
                ? undefined
                : () => {
                    resetConversation()
                  }
            }
          >
            <PanelAiAgent />
          </PanelWrapper>
        )}
      </Panel>
    </>
  )
}
