import { createContext, ReactNode, RefObject, useContext, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'

interface AIAssistantContextType {
  isOpen: boolean
  panelRef: RefObject<ImperativePanelHandle>
  togglePanel: () => void
}

export const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export const PANEL_OPEN = 20
export const PANEL_CLOSED = 0

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<ImperativePanelHandle>(null)

  const togglePanel = () => {
    const panel = panelRef.current

    if (panel) {
      if (panel.getSize() === PANEL_OPEN) {
        panel.resize(PANEL_CLOSED)
        setIsOpen(false)
      } else {
        panel.resize(PANEL_OPEN)
        setIsOpen(true)
      }
    }
  }

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        panelRef,
        togglePanel,
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
