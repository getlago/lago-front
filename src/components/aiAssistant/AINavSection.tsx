import { Button } from 'lago-design-system'

import { AIPanelEnum, useAiAgentTool } from '~/hooks/aiAgent/useAiAgent'

export const AINavSection = () => {
  const { togglePanel, panelOpened } = useAiAgentTool()

  return (
    <div className="flex flex-row gap-2 p-2">
      <Button
        startIcon="sparkles"
        size="small"
        variant={panelOpened === AIPanelEnum.ai ? 'secondary' : 'quaternary'}
        onClick={() => togglePanel(AIPanelEnum.ai)}
      >
        <div>AI Assistant</div>
      </Button>
    </div>
  )
}
