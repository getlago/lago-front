import { createContext, ReactNode, RefObject, useContext, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'

interface AIAssistantContextType {
  isOpen: boolean
  panelOpened: AIPanelEnum | undefined
  panelRef: RefObject<ImperativePanelHandle>
  togglePanel: (panel: AIPanelEnum) => void
  closePanel: () => void
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

  const openPanel = (panel: AIPanelEnum) => {
    if (panelRef.current) {
      panelRef.current.resize(PANEL_OPEN)
      setCurrentPanel(panel)
    }
  }

  const closePanel = () => {
    if (panelRef.current) {
      panelRef.current.resize(PANEL_CLOSED)
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

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen: !!panelOpened,
        panelOpened,
        panelRef,
        togglePanel,
        closePanel,
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
