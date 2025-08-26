import { Button } from 'lago-design-system'

import { AIPanelEnum, useAIAssistantTool } from '~/hooks/useAIAssistantTool'

export const AINavSection = () => {
  const { togglePanel, panelOpened } = useAIAssistantTool()

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
