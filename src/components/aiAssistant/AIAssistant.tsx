import { Button, tw, Typography } from 'lago-design-system'
import { Panel, PanelResizeHandle } from 'react-resizable-panels'

import { AINavSection } from '~/components/aiAssistant/AINavSection'
import { AIPanel } from '~/components/aiAssistant/AIPanel'
import {
  AIPanelEnum,
  PANEL_CLOSED,
  PANEL_OPEN,
  useAIAssistantTool,
} from '~/hooks/useAIAssistantTool'
import { useCurrentUser } from '~/hooks/useCurrentUser'

const AIWrapper = ({
  children,
  title,
  isBeta,
  onBackButton,
}: {
  children: React.ReactNode
  title: string
  isBeta: boolean
  onBackButton?: () => void
}) => {
  const { closePanel } = useAIAssistantTool()

  return (
    <div>
      <div className="flex flex-row justify-between gap-4 px-6 py-5 shadow-b">
        <div className="flex items-center gap-2">
          {!!onBackButton && (
            <Button size="small" variant="quaternary" icon="arrow-left" onClick={onBackButton} />
          )}
          <Typography variant="bodyHl" noWrap color="grey700">
            {title}
          </Typography>
          {isBeta && (
            <Typography variant="noteHl" noWrap color="warning700">
              BETA
            </Typography>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" variant="quaternary" icon="resize-expand" />
          <Button size="small" variant="quaternary" icon="close" onClick={() => closePanel()} />
        </div>
      </div>
      <div className="height-minus-nav flex flex-col justify-between overflow-y-auto p-4">
        {children}
      </div>
    </div>
  )
}

export const AIAssistant = () => {
  const { panelRef, panelOpened, isOpen, message, resetConversation } = useAIAssistantTool()

  const { currentUser } = useCurrentUser()

  if (!currentUser) {
    return null
  }

  return (
    <>
      <div className="relative">
        <div className="h-screen w-12 bg-white shadow-l">
          <div className="absolute rotate-90-tl">
            <AINavSection />
          </div>
        </div>
      </div>

      <PanelResizeHandle />

      <Panel
        ref={panelRef}
        defaultSize={PANEL_CLOSED}
        minSize={PANEL_CLOSED}
        maxSize={PANEL_OPEN}
        className={tw(isOpen ? 'min-w-[420px]' : 'min-w-[0px]', 'shadow-l')}
      >
        {panelOpened === AIPanelEnum.ai && (
          <AIWrapper
            title={message ? 'Test' : 'AI Assistant'}
            isBeta={!message}
            onBackButton={() => {
              resetConversation()
            }}
          >
            <AIPanel />
          </AIWrapper>
        )}
      </Panel>
    </>
  )
}
