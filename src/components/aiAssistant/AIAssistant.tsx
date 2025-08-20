import { Button, tw, Typography } from 'lago-design-system'
import { Panel } from 'react-resizable-panels'

import { AINavSection } from '~/components/aiAssistant/AINavSection'
import { AIPanel } from '~/components/aiAssistant/AIPanel'
import {
  AIPanelEnum,
  PANEL_CLOSED,
  PANEL_OPEN,
  useAIAssistantTool,
} from '~/hooks/useAIAssistantTool'

const AIWrapper = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const { closePanel } = useAIAssistantTool()

  return (
    <div>
      <div className="flex flex-row justify-between gap-4 px-6 py-5 shadow-b">
        <div className="flex items-center gap-2">
          <Typography variant="bodyHl" noWrap color="grey700">
            {title}
          </Typography>
          <Typography variant="noteHl" noWrap color="warning700">
            BETA
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" variant="quaternary" icon="resize-expand" />
          <Button size="small" variant="quaternary" icon="close" onClick={() => closePanel()} />
        </div>
      </div>
      <div className="min-height-minus-nav overflow-y-auto p-4">{children}</div>
    </div>
  )
}

export const AIAssistant = () => {
  const { panelRef, panelOpened, isOpen } = useAIAssistantTool()

  return (
    <>
      <div className="relative">
        <div className="h-screen w-12 bg-white shadow-l">
          <div className="absolute rotate-90-tl">
            <AINavSection />
          </div>
        </div>
      </div>

      <Panel
        ref={panelRef}
        defaultSize={PANEL_CLOSED}
        minSize={PANEL_CLOSED}
        maxSize={PANEL_OPEN}
        className={tw(isOpen ? 'min-w-[420px]' : 'min-w-[0px]', 'shadow-l')}
      >
        {panelOpened === AIPanelEnum.ai && (
          <AIWrapper title="AI Assistant">
            <AIPanel />
          </AIWrapper>
        )}
      </Panel>
    </>
  )
}
