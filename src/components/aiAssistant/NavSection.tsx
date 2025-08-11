import { Button } from 'lago-design-system'

import { useAIAssistantTool } from '~/hooks/useAIAssistantTool'

export const NavSection = () => {
  const { togglePanel } = useAIAssistantTool()

  return (
    <div className="flex flex-row gap-2 p-2">
      <Button size="small" variant="quaternary" startIcon="sparkles" onClick={() => togglePanel()}>
        AI Assistant
      </Button>
    </div>
  )
}
