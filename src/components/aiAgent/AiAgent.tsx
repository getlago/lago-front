import { tw } from 'lago-design-system'
import { useState } from 'react'
import { Panel, PanelResizeHandle } from 'react-resizable-panels'

import { ChatHistory } from '~/components/aiAgent/ChatHistory'
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

  const [showHistory, setShowHistory] = useState(false)

  if (!currentUser || !hasAccessToAiAgent) {
    return null
  }

  const shouldDisplayWelcomeMessage = !state.messages.length

  const onBackButton = () => {
    if (showHistory) {
      return setShowHistory(false)
    }

    return resetConversation()
  }

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
        className={tw(panelOpen ? 'min-w-[360px] max-w-[420px]' : 'min-w-[0px]', 'shadow-l')}
      >
        {currentPanelOpened === AIPanelEnum.ai && (
          <PanelWrapper
            title={
              showHistory
                ? translate('text_17574172258513wv8yozezoz')
                : (state.messages[0]?.message ?? translate('text_175741722585199myqwj6vyw'))
            }
            isBeta={shouldDisplayWelcomeMessage && !showHistory}
            showBackButton={!shouldDisplayWelcomeMessage || showHistory}
            onBackButton={onBackButton}
            showHistoryButton={!showHistory}
            onShowHistory={() => setShowHistory(true)}
          >
            {showHistory && <ChatHistory hideHistory={() => setShowHistory(false)} />}

            {!showHistory && <PanelAiAgent />}
          </PanelWrapper>
        )}
      </Panel>
    </>
  )
}
