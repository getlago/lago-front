import { captureException } from '@sentry/react'
import { RefObject, useRef, useState } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'

interface UsePanelProps {
  size: {
    open: number
    closed: number
    maxResizableHeight?: number
    minResizableHeight?: number
    fullscreen?: number
  }
}

export interface UsePanelReturn<T = unknown> {
  panelRef: RefObject<ImperativePanelHandle>
  panelOpen: boolean
  currentPanelOpened: T | undefined
  isFullscreen: boolean
  openPanel: (panel?: T) => void
  closePanel: () => void
  togglePanel: (panel?: T) => void
  expandPanel: () => void
  resizePanel: (size: number) => void
}

export const usePanel = <T,>({ size }: UsePanelProps) => {
  const panelRef = useRef<ImperativePanelHandle>(null)
  const [panelOpen, setOpenPanel] = useState(false)
  const [currentPanelOpened, setCurrentPanel] = useState<T>()
  const [isFullscreen, setIsFullscreen] = useState(false)

  // `react-resizable-panels` throws (`Panel size not found for panel "…"`) until the panel is
  // in the group's committed layout, so the resize waits a frame and the catch keeps that
  // assert away from the error boundary.
  const safeResize = (height: number) => {
    requestAnimationFrame(() => {
      try {
        panelRef.current?.resize(height)
      } catch (error) {
        captureException(error)
      }
    })
  }

  const openPanel = (panel?: T) => {
    safeResize(size.open)

    setOpenPanel(true)

    if (panel) {
      setCurrentPanel(panel)
    }
  }

  const closePanel = () => {
    if (panelRef.current) {
      panelRef.current.resize(size.closed)
    }

    setOpenPanel(false)
    setCurrentPanel(undefined)
    setIsFullscreen(false)
  }

  const togglePanel = (panel?: T) => {
    if (panelOpen && currentPanelOpened === panel) {
      closePanel()
    } else {
      openPanel(panel)
    }
  }

  const expandPanel = () => {
    let isLocalFullscreen = false
    let height

    if (isFullscreen) {
      isLocalFullscreen = false
      height = size.open
    } else {
      isLocalFullscreen = true
      height = size.fullscreen ?? size.open
    }

    setIsFullscreen(isLocalFullscreen)

    safeResize(height)
  }

  const resizePanel = (value: number) => {
    if (size.fullscreen && value === size.fullscreen) {
      setIsFullscreen(true)
    } else if (size.fullscreen && value < size.fullscreen) {
      setIsFullscreen(false)
    }
  }

  return {
    panelRef,
    currentPanelOpened,
    panelOpen,
    isFullscreen,
    openPanel,
    closePanel,
    togglePanel,
    expandPanel,
    resizePanel,
  }
}
