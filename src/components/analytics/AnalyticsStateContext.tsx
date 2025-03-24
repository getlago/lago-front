import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react'

interface RevenueStreamsStateContextValue {
  hoverDataIndex: number | undefined
  clickedDataIndex: number | undefined
  setHoverDataIndex: (index: number | undefined) => void
  setClickedDataIndex: (index: number | undefined) => void
}

const MIN_UPDATE_INTERVAL = 1000 / 60 // Cap at 60fps

const AnalyticsStateContext = createContext<RevenueStreamsStateContextValue | undefined>(undefined)

export const AnalyticsStateProvider = ({ children }: { children: ReactNode }) => {
  const [hoverDataIndex, setHoverDataIndexState] = useState<number | undefined>(undefined)
  const [clickedDataIndex, setClickedDataIndexState] = useState<number | undefined>(undefined)

  const prevHoverIndex = useRef<number | undefined>(undefined)
  const lastUpdateTime = useRef<number>(0)

  // Optimized setter for hover state to prevent too many updates
  const setHoverDataIndex = useCallback((index: number | undefined) => {
    const now = performance.now()

    if (index !== prevHoverIndex.current && now - lastUpdateTime.current >= MIN_UPDATE_INTERVAL) {
      prevHoverIndex.current = index
      lastUpdateTime.current = now
      setHoverDataIndexState(index)
    }
  }, [])

  const setClickedDataIndex = useCallback((index: number | undefined) => {
    setClickedDataIndexState(index)
  }, [])

  const value = {
    hoverDataIndex,
    clickedDataIndex,
    setHoverDataIndex,
    setClickedDataIndex,
  }

  return <AnalyticsStateContext.Provider value={value}>{children}</AnalyticsStateContext.Provider>
}

export const useAnalyticsState = (): RevenueStreamsStateContextValue => {
  const context = useContext(AnalyticsStateContext)

  if (!context) {
    throw new Error('useAnalyticsState must be used within an AnalyticsStateProvider')
  }

  return context
}
