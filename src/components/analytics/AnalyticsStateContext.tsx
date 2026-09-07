import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

interface RevenueStreamsStateContextValue {
  hoverDataIndex: number | undefined
  clickedDataIndex: number | undefined
  setHoverDataIndex: (index: number | undefined) => void
  setClickedDataIndex: (index: number | undefined) => void
  handleMouseLeave: () => void
}

const AnalyticsStateContext = createContext<RevenueStreamsStateContextValue | undefined>(undefined)

export const AnalyticsStateProvider = ({ children }: { children: ReactNode }) => {
  const [hoverDataIndex, setHoverDataIndex] = useState<number | undefined>(undefined)
  const [clickedDataIndex, setClickedDataIndex] = useState<number | undefined>(undefined)

  const handleMouseLeave = useCallback((): void => {
    setHoverDataIndex(undefined)
  }, [])

  const value = {
    hoverDataIndex,
    clickedDataIndex,
    setHoverDataIndex,
    setClickedDataIndex,
    handleMouseLeave,
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
