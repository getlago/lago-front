import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import { GlobalHeaderConfig } from './types'

interface GlobalHeaderWriteContextValue {
  setConfig: (config: GlobalHeaderConfig) => void
  resetConfig: () => void
  registerConfigure: () => void
  unregisterConfigure: () => void
}

const GlobalHeaderWriteContext = createContext<GlobalHeaderWriteContextValue | undefined>(undefined)

interface GlobalHeaderReadContextValue {
  config: GlobalHeaderConfig | null
}

const GlobalHeaderReadContext = createContext<GlobalHeaderReadContextValue | undefined>(undefined)

export const GlobalHeaderProvider: FC<PropsWithChildren> = ({ children }) => {
  const [config, setConfigState] = useState<GlobalHeaderConfig | null>(null)
  const mountCountRef = useRef(0)

  const setConfig = useCallback((newConfig: GlobalHeaderConfig) => {
    setConfigState(newConfig)
  }, [])

  const resetConfig = useCallback(() => {
    setConfigState(null)
  }, [])

  const registerConfigure = useCallback(() => {
    mountCountRef.current += 1

    if (process.env.NODE_ENV === 'development' && mountCountRef.current > 1) {
      // eslint-disable-next-line no-console
      console.warn(
        'Multiple GlobalHeader.Configure mounted simultaneously. Only the last one will be used.',
      )
    }
  }, [])

  const unregisterConfigure = useCallback(() => {
    mountCountRef.current -= 1
  }, [])

  // Stable — all callbacks are memoized with empty deps, so this never changes
  const writeValue = useMemo(
    () => ({ setConfig, resetConfig, registerConfigure, unregisterConfigure }),
    [setConfig, resetConfig, registerConfigure, unregisterConfigure],
  )

  // Reactive — changes when config changes
  const readValue = useMemo(() => ({ config }), [config])

  return (
    <GlobalHeaderWriteContext.Provider value={writeValue}>
      <GlobalHeaderReadContext.Provider value={readValue}>
        {children}
      </GlobalHeaderReadContext.Provider>
    </GlobalHeaderWriteContext.Provider>
  )
}

/** Used by Configure — write-only, never re-renders on config change */
export const useGlobalHeaderWriter = () => {
  const context = useContext(GlobalHeaderWriteContext)

  if (context === undefined) {
    throw new Error('useGlobalHeaderWriter must be used within a GlobalHeaderProvider')
  }

  return context
}

/** Used by GlobalHeader — read-only, re-renders when config changes */
export const useGlobalHeaderReader = () => {
  const context = useContext(GlobalHeaderReadContext)

  if (context === undefined) {
    throw new Error('useGlobalHeaderReader must be used within a GlobalHeaderProvider')
  }

  return context
}
