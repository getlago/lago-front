import { Button } from 'lago-design-system'

import { AIPanelEnum, useAIAssistantTool } from '~/hooks/useAIAssistantTool'

export const AINavSection = () => {
  const { togglePanel } = useAIAssistantTool()

  return (
    <div className="flex flex-row gap-2 p-2">
      <Button
        size="small"
        variant="quaternary"
        startIcon="sparkles"
        onClick={() => togglePanel(AIPanelEnum.ai)}
      >
        AI Assistant
      </Button>
    </div>
  )
}
