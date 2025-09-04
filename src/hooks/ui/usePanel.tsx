import { RefObject, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'

interface UsePanelProps {
  size: {
    open: number
    closed: number
  }
}

export interface UsePanelReturn<T> {
  panelRef: RefObject<ImperativePanelHandle>
  panelOpened: T | undefined
  openPanel: (panel: T) => void
  closePanel: () => void
  togglePanel: (panel: T) => void
}

export const usePanel = <T,>({ size }: UsePanelProps) => {
  const panelRef = useRef<ImperativePanelHandle>(null)
  const [panelOpened, setCurrentPanel] = useState<T>()

  const openPanel = (panel: T) => {
    if (panelRef.current) {
      panelRef.current.resize(size.open)
      setCurrentPanel(panel)
    }
  }

  const closePanel = () => {
    if (panelRef.current) {
      panelRef.current.resize(size.closed)
      setCurrentPanel(undefined)
    }
  }

  const togglePanel = (panel: T) => {
    if (panelOpened === panel) {
      closePanel()
    } else {
      openPanel(panel)
    }
  }

  return {
    panelRef,
    panelOpened,
    openPanel,
    closePanel,
    togglePanel,
  }
}
