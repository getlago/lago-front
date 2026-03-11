import { FC, useEffect, useRef } from 'react'

import { useMainHeaderWriter } from './MainHeaderContext'
import { MainHeaderConfig } from './types'

/**
 * Serializable snapshot of the config. The JSON.stringify replacer automatically
 * strips functions (onClick callbacks) and the `content` key (ReactNode in tabs).
 * Everything else — primitives, labels, flags — is kept.
 *
 * Used by Configure to detect meaningful changes: same snapshot → skip setConfig.
 */
function configSnapshot(config: MainHeaderConfig): string {
  return JSON.stringify(config, (key, value) => {
    if (typeof value === 'function') return undefined
    if (key === 'content') return undefined

    return value
  })
}

/**
 * Declarative zero-render component that configures the MainHeader.
 * Works like <Helmet> / <Head> — renders nothing, communicates via Context.
 *
 * Loop prevention: a snapshot is computed from the config
 * on every render. The useEffect only calls setConfig when the snapshot
 * changes, so context-triggered re-renders (which produce the same data,
 * just new object references) are silently ignored. No useMemo required
 * from consumer pages.
 */
export const MainHeaderConfigure: FC<MainHeaderConfig> = (props) => {
  const { setConfig, resetConfig, registerConfigure, unregisterConfigure } = useMainHeaderWriter()

  // Ref keeps the latest props available for the deferred useEffect,
  // so setConfig always receives the freshest values.
  const propsRef = useRef(props)

  propsRef.current = props

  // Track mount/unmount for dev warning on multiple instances
  useEffect(() => {
    registerConfigure()

    return () => unregisterConfigure()
  }, [registerConfigure, unregisterConfigure])

  // Only push to context when the visual snapshot changes.
  // Context-triggered re-renders produce identical snapshots → no setConfig → no loop.
  const snapshot = configSnapshot(props)

  useEffect(() => {
    setConfig(propsRef.current)
  }, [snapshot, setConfig])

  // Cleanup on unmount — reset config to null
  useEffect(() => {
    return () => resetConfig()
  }, [resetConfig])

  return null
}
