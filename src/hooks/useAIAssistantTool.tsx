import { createContext, ReactNode, RefObject, useContext, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'

interface AIAssistantContextType {
  isOpen: boolean
  panelOpened: AIPanelEnum | undefined
  panelRef: RefObject<ImperativePanelHandle>
  conversationId: string | undefined
  message: string
  togglePanel: (panel: AIPanelEnum) => void
  closePanel: () => void
  startNewConversation: (params: { conversationId: string; message: string }) => void
  resetConversation: () => void
}

export const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export const PANEL_OPEN = 33
export const PANEL_CLOSED = 0

export enum AIPanelEnum {
  ai = 'ai',
}

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const panelRef = useRef<ImperativePanelHandle>(null)
  const [panelOpened, setCurrentPanel] = useState<AIPanelEnum | undefined>(undefined)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [message, setMessage] = useState('')

  const resetState = () => {
    setConversationId(undefined)
    setMessage('')
  }

  const openPanel = (panel: AIPanelEnum) => {
    if (panelRef.current) {
      panelRef.current.resize(PANEL_OPEN)
      resetState()
      setCurrentPanel(panel)
    }
  }

  const closePanel = () => {
    if (panelRef.current) {
      panelRef.current.resize(PANEL_CLOSED)
      resetState()
      setCurrentPanel(undefined)
    }
  }

  const togglePanel = (panel: AIPanelEnum) => {
    if (panelOpened === panel) {
      closePanel()
    } else {
      openPanel(panel)
    }
  }

  const startNewConversation = (params: { conversationId: string; message: string }) => {
    setConversationId(params.conversationId)
    setMessage(params.message)
  }

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen: !!panelOpened,
        panelOpened,
        panelRef,
        conversationId,
        message,
        togglePanel,
        closePanel,
        startNewConversation,
        resetConversation: resetState,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  )
}

export function useAIAssistantTool(): AIAssistantContextType {
  const context = useContext(AIAssistantContext)

  if (!context) {
    throw new Error('useAIAssistantTool must be used within an AIAssistantProvider')
  }

  return context
}
