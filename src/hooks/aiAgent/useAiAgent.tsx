import { createContext, ReactNode, useContext, useState } from 'react'

import { usePanel, UsePanelReturn } from '~/hooks/ui/usePanel'

export enum AIPanelEnum {
  ai = 'ai',
}

interface AiAgentContextType extends UsePanelReturn<AIPanelEnum> {
  isOpen: boolean
  conversationId: string | undefined
  message: string
  startNewConversation: (params: { id: string; message: string }) => void
  resetConversation: () => void
}

export const AiAgentContext = createContext<AiAgentContextType | undefined>(undefined)

export const PANEL_OPEN = 33
export const PANEL_CLOSED = 0

export function AiAgentProvider({ children }: { children: ReactNode }) {
  const panel = usePanel<AIPanelEnum>({
    size: {
      open: PANEL_OPEN,
      closed: PANEL_CLOSED,
    },
  })

  const [conversationId, setConversationId] = useState('')
  const [message, setMessage] = useState('')

  const resetState = () => {
    setConversationId('')
    setMessage('')
  }

  const startNewConversation = (params: { id: string; message: string }) => {
    setConversationId(params.id)
    setMessage(params.message)
  }

  return (
    <AiAgentContext.Provider
      value={{
        ...panel,
        isOpen: !!panel.panelOpened,
        conversationId,
        message,
        startNewConversation,
        resetConversation: resetState,
      }}
    >
      {children}
    </AiAgentContext.Provider>
  )
}

export function useAiAgentTool(): AiAgentContextType {
  const context = useContext(AiAgentContext)

  if (!context) {
    throw new Error('useAiAgentTool must be used within an AiAgentProvider')
  }

  return context
}
